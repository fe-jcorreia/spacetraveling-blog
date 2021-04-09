import { GetStaticProps } from 'next';
import Head from "next/head";
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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

export default function Home() {
  return (
    <>
      <Head>
        <title>Home | SpaceTravelingBlog</title>
      </Head>
      <main className={styles.container}>
        <div className={styles.posts}>
          <h1>teste</h1>
          {/* {postsPagination.results.map(post => (
            <Link href={`/${post.uid}`}>
              <a key={post.uid}>
                <time>{post.first_publication_date}</time>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
              </a>
            </Link>
          ))} */}
        </div>
      </main>
    </>
  );
}

// export const getStaticProps = async () => {
//   const prismic = getPrismicClient();
//   const postsResponse = await prismic.query(TODO);

// };
