import Link from "next/link";
import type { LegalDocument as LegalDocumentContent } from "./legal";
import styles from "./legal-document.module.css";

const linkPattern =
  /(info\.voicyy@gmail\.com|www\.garanteprivacy\.it|\+39 392 114 3643)/g;

function LinkifiedText({ children }: { children: string }) {
  return children.split(linkPattern).map((part, index) => {
    if (part === "info.voicyy@gmail.com") {
      return (
        <a className={styles.inlineLink} href="mailto:info.voicyy@gmail.com" key={`${part}-${index}`}>
          {part}
        </a>
      );
    }

    if (part === "www.garanteprivacy.it") {
      return (
        <a
          className={styles.inlineLink}
          href="https://www.garanteprivacy.it"
          key={`${part}-${index}`}
          rel="noreferrer"
          target="_blank"
        >
          {part}
        </a>
      );
    }

    if (part === "+39 392 114 3643") {
      return (
        <a
          className={styles.inlineLink}
          href="https://wa.me/393921143643"
          key={`${part}-${index}`}
          rel="noreferrer"
          target="_blank"
        >
          {part}
        </a>
      );
    }

    return part;
  });
}

export function LegalDocument({ document }: { document: LegalDocumentContent }) {
  return (
    <div className={styles.shell}>
      <nav aria-label="Navigazione documento" className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.brand} href="/" aria-label="Voicyy — torna alla homepage">
            voicyy
          </Link>
          <Link className={styles.backLink} href="/">
            Torna al sito
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Documentazione legale</p>
          <h1 className={styles.title}>{document.title}</h1>
          {document.introduction ? (
            <p className={styles.introduction}>{document.introduction}</p>
          ) : null}
          <time className={styles.updated} dateTime={document.updatedDate}>
            {document.updated}
          </time>
        </header>

        <article className={styles.article}>
          {document.sections.map((section) => (
            <section className={styles.section} id={section.id} key={section.id}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p className={styles.paragraph} key={paragraph}>
                  <LinkifiedText>{paragraph}</LinkifiedText>
                </p>
              ))}
              {section.bullets ? (
                <ul className={styles.list}>
                  {section.bullets.map((item) => (
                    <li key={item}>
                      <LinkifiedText>{item}</LinkifiedText>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.afterParagraphs?.map((paragraph) => (
                <p className={`${styles.paragraph} ${styles.afterParagraph}`} key={paragraph}>
                  <LinkifiedText>{paragraph}</LinkifiedText>
                </p>
              ))}
            </section>
          ))}
        </article>

        <aside className={styles.note} aria-label="Nota prima della pubblicazione">
          <strong>Nota pre-pubblicazione — non parte del testo sopra.</strong> Prima di rendere
          pubblico il documento, completare l&apos;identità giuridica del titolare/fornitore,
          la sede e la Partita IVA e sottoporre il testo a verifica professionale, ove
          necessaria.
        </aside>
      </main>
    </div>
  );
}
