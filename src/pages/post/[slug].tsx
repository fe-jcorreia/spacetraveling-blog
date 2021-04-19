import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import PrismicDOM from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { Fragment, useMemo } from 'react';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const reducer = (sumContent, thisContent) => {
    const headingWords = thisContent.heading.split(/\s/g).length;
    const bodyWords = thisContent.body.reduce((sumBody, thisBody) => {
      const textWords = thisBody.text.split(/\s/g).length;

      return sumBody + textWords;
    }, 0);
    return sumContent + headingWords + bodyWords;
  };

  const wordCount = post.data.content.reduce(reducer, 0);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | SpaceTravelingBlog</title>
      </Head>

      <Header />

      <img className={styles.banner} src={post.data.banner.url} />
      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <section className={styles.postStatus}>
            <time>
              <FiCalendar />
              {'  ' +
                format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
            </time>
            <span>
              <FiUser />
              {'  ' + post.data.author}
            </span>
            <span>
              <FiClock /> {'  '} {Math.ceil(wordCount / 200)} min
            </span>
          </section>

          <section className={styles.content}>
            {post.data.content.map(({ heading, body }) => (
              <Fragment key={heading}>
                <h2>{heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: PrismicDOM.RichText.asHtml(body),
                  }}
                />
              </Fragment>
            ))}
          </section>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'pos'),
  ]);

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths: paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('pos', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content.map(({ heading, body }) => {
        return {
          heading: heading,
          body: body,
        };
      }),
    },
  };

  return {
    props: { post },
    revalidate: 60 * 30,
  };
};
