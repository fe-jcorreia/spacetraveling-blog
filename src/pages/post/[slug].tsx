import next, { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import PrismicDOM from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import Header from '../../components/Header';
import { UtterancesComments } from '../../components/UtterancesComments';
import Link from 'next/link';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  previousPost: { uid?: string; title?: string };
  nextPost: { uid?: string; title?: string };
}

export default function Post({
  post,
  previousPost,
  nextPost,
  preview,
}: PostProps) {
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
            <span>
              {'* editado em ' +
                format(new Date(post.last_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                }) +
                ', às ' +
                format(new Date(post.last_publication_date), 'HH:mm', {
                  locale: ptBR,
                })}
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

        <div className={styles.navPosts}>
          {previousPost.uid ? (
            <Link href={`/post/${previousPost.uid}`}>
              <a>
                <strong>Previous Post</strong> <br />
                {`${previousPost.title}`}
              </a>
            </Link>
          ) : (
            <a></a>
          )}

          {nextPost.uid ? (
            <Link href={`/post/${nextPost.uid}`}>
              <a>
                <strong>Next Post</strong> <br />
                {`${nextPost.title}`}
              </a>
            </Link>
          ) : (
            <a></a>
          )}
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <UtterancesComments />
        </div>

        <div className={styles.previewMode}>
          <script
            async
            defer
            src="https://static.cdn.prismic.io/prismic.js?new=true&repo=spacetravelingblg"
          ></script>
          {preview ? (
            <aside>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          ) : (
            <aside>
              <Link href="/api/preview">
                <a>Entrar no modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('pos', String(slug), {});

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
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

  const responsePreviousPost = (
    await prismic.query(
      Prismic.Predicates.dateBefore(
        'document.first_publication_date',
        response.first_publication_date
      ),
      { orderings: '[document.first_publication_date]' }
    )
  ).results.pop();

  const responseNextPost = (
    await prismic.query(
      Prismic.Predicates.dateAfter(
        'document.first_publication_date',
        response.first_publication_date
      ),
      { orderings: '[document.first_publication_date]' }
    )
  ).results[0];

  const previousPost = {
    uid: responsePreviousPost?.uid ? responsePreviousPost.uid : '',
    title: responsePreviousPost?.data.title
      ? responsePreviousPost.data.title
      : '',
  };

  const nextPost = {
    uid: responseNextPost?.uid ? responseNextPost.uid : '',
    title: responseNextPost?.data.title ? responseNextPost.data.title : '',
  };

  return {
    props: { post, previousPost, nextPost, preview },
    revalidate: 60 * 30,
  };
};
