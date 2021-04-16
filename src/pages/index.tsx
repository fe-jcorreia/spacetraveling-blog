import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import { FiCalendar, FiUser } from 'react-icons/fi';
import styles from './home.module.scss';
import { useState } from 'react';
import { postFormatter } from '../formatters/prismicResponseFormatter';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadPosts() {
    await fetch(nextPage ? nextPage : '')
      .then(response => response.json())
      .then(data => {
        const formattedData = postFormatter(data);
        setPosts([...posts, ...formattedData.results]);
        setNextPage(formattedData.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Home | SpaceTravelingBlog</title>
      </Head>
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.postStatus}>
                  <time style={{ textTransform: 'capitalize' }}>
                    <FiCalendar />
                    {'  ' + post.first_publication_date}
                  </time>
                  <p>
                    <FiUser />
                    {'  ' + post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}
          {nextPage ? (
            <button onClick={handleLoadPosts}>Carregar mais posts</button>
          ) : (
            ''
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'pos')],
    {
      pageSize: 2,
    }
  );

  const postsPagination = postFormatter(postsResponse);

  return {
    props: { postsPagination },
  };
};
