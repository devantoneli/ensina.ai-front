'use client';

import { Children, cloneElement, isValidElement, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Term = {
  term: string;
  explanation: string;
};

type Cite = {
  source: string;
  url?: string;
};

function BookOpenIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="tutor-term-icon">
      <path
        d="M12 7.5v11.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 6.5h5.75a1.75 1.75 0 0 1 1.75 1.75v10.5a1.25 1.25 0 0 1-1.84 1.11l-5.11-2.56a1.5 1.5 0 0 0-1.34 0l-5.11 2.56a1.25 1.25 0 0 1-1.84-1.11V8.25A1.75 1.75 0 0 1 7.5 6.5h5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 6.5H6.25A1.75 1.75 0 0 0 4.5 8.25v10.5a1.25 1.25 0 0 0 1.84 1.11l5.16-2.58"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TutorMarkdownProps = {
  children: string;
  className?: string;
  sources?: Array<{ name?: string; url?: string }>;
};

const TERM_PATTERN = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;
const CITE_PATTERN = /\[cite:\s*(.+?)\]/g;
const PLACEHOLDER_PATTERN = /⁣TERM(\d+)⁣/g;
const CITE_PLACEHOLDER_PATTERN = /⁣CITE(\d+)⁣/g;

function extractTerms(
  content: string,
  sources?: Array<{ name?: string; url?: string }>,
): { markdown: string; terms: Term[]; cites: Cite[] } {
  const terms: Term[] = [];
  const cites: Cite[] = [];

  let markdown = content.replace(TERM_PATTERN, (_match, term: string, explanation: string) => {
    const index = terms.length;
    terms.push({ term: term.trim(), explanation: explanation.trim() });
    return `⁣TERM${index}⁣`;
  });

  markdown = markdown.replace(CITE_PATTERN, (_match, sourcesString: string) => {
    const sourceNames = sourcesString.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    
    return sourceNames.map(name => {
      const index = cites.length;
      const matched = sources?.find((s) => s.name?.toLowerCase() === name.toLowerCase());
      cites.push({ source: name, url: matched?.url });
      return `⁣CITE${index}⁣`;
    }).join(' ');
  });

  return { markdown, terms, cites };
}

function TermPopover({ term, explanation }: Term) {
  return (
    <details className="tutor-term">
      <summary className="tutor-term-trigger">
        <BookOpenIcon />
        <span>{term}</span>
      </summary>
      <div className="tutor-term-popover">
        <p className="tutor-term-title">{term}</p>
        <p className="tutor-term-explanation">{explanation}</p>
      </div>
    </details>
  );
}

function CiteBadge({ source, url }: Cite) {
  const inner = (
    <>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
      <span className="tutor-cite-name">{source}</span>
    </>
  );
  if (url) {
    return (
      <a className="tutor-cite tutor-cite--link" href={url} target="_blank" rel="noreferrer" title={`Fonte: ${source}`}>
        {inner}
      </a>
    );
  }
  return (
    <span className="tutor-cite" title={`Fonte: ${source}`}>
      {inner}
    </span>
  );
}

function renderPlaceholderText(text: string, terms: Term[], cites: Cite[]) {
  const combined = /⁣TERM(\d+)⁣|⁣CITE(\d+)⁣/g;
  const nodes: Array<string | React.ReactElement> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(combined)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    if (match[1] !== undefined) {
      const term = terms[Number(match[1])];
      nodes.push(term
        ? <TermPopover key={`term-${index}`} {...term} />
        : match[0]);
    } else if (match[2] !== undefined) {
      const cite = cites[Number(match[2])];
      nodes.push(cite
        ? <CiteBadge key={`cite-${index}`} {...cite} />
        : match[0]);
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function processChildren(children: React.ReactNode, terms: Term[], cites: Cite[]): React.ReactNode {
  return Children.toArray(children).flatMap((child, childIndex) => {
    if (typeof child === 'string') {
      return renderPlaceholderText(child, terms, cites);
    }

    if (typeof child === 'number') {
      return child;
    }

    if (isValidElement(child)) {
      const childProps = child.props as Record<string, unknown>;
      if (childProps.children !== undefined) {
        return cloneElement(child as React.ReactElement<Record<string, unknown>>, {
          key: child.key ?? childIndex,
          children: processChildren(childProps.children as React.ReactNode, terms, cites),
        });
      }
    }

    return child;
  });
}

export default function TutorMarkdown({ children, className = '', sources }: TutorMarkdownProps) {
  const { markdown, terms, cites } = useMemo(() => extractTerms(children, sources), [children, sources]);

  const components = useMemo(
    () => ({
      h1: ({ children: nodeChildren, ...props }: React.ComponentProps<'h1'>) => (
        <h1 {...props}>{processChildren(nodeChildren, terms, cites)}</h1>
      ),
      h2: ({ children: nodeChildren, ...props }: React.ComponentProps<'h2'>) => (
        <h2 {...props}>{processChildren(nodeChildren, terms, cites)}</h2>
      ),
      h3: ({ children: nodeChildren, ...props }: React.ComponentProps<'h3'>) => (
        <h3 {...props}>{processChildren(nodeChildren, terms, cites)}</h3>
      ),
      h4: ({ children: nodeChildren, ...props }: React.ComponentProps<'h4'>) => (
        <h4 {...props}>{processChildren(nodeChildren, terms, cites)}</h4>
      ),
      p: ({ children: nodeChildren, ref, ...props }: React.ComponentProps<'p'>) => {
        const { ...divProps } = props as any;
        return (
          <div {...divProps} className={`tutor-p ${props.className || ''}`.trim()}>
            {processChildren(nodeChildren, terms, cites)}
          </div>
        );
      },
      ul: ({ children: nodeChildren, ...props }: React.ComponentProps<'ul'>) => (
        <ul {...props}>{processChildren(nodeChildren, terms, cites)}</ul>
      ),
      ol: ({ children: nodeChildren, ...props }: React.ComponentProps<'ol'>) => (
        <ol {...props}>{processChildren(nodeChildren, terms, cites)}</ol>
      ),
      li: ({ children: nodeChildren, ...props }: React.ComponentProps<'li'>) => (
        <li {...props}>{processChildren(nodeChildren, terms, cites)}</li>
      ),
      strong: ({ children: nodeChildren, ...props }: React.ComponentProps<'strong'>) => (
        <strong {...props}>{processChildren(nodeChildren, terms, cites)}</strong>
      ),
      em: ({ children: nodeChildren, ...props }: React.ComponentProps<'em'>) => (
        <em {...props}>{processChildren(nodeChildren, terms, cites)}</em>
      ),
      blockquote: ({ children: nodeChildren, ...props }: React.ComponentProps<'blockquote'>) => (
        <blockquote {...props}>{processChildren(nodeChildren, terms, cites)}</blockquote>
      ),
      hr: (props: React.ComponentProps<'hr'>) => <hr {...props} />,
      a: ({ children: nodeChildren, href, ...props }: React.ComponentProps<'a'>) => (
        <a {...props} href={href} target="_blank" rel="noreferrer">
          {processChildren(nodeChildren, terms, cites)}
        </a>
      ),
      pre: ({ children: nodeChildren, ...props }: React.ComponentProps<'pre'>) => (
        <pre {...props} className="tutor-code-block">{nodeChildren}</pre>
      ),
      code: ({ children: nodeChildren, inline, className: codeClassName, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) => {
        const content = processChildren(nodeChildren, terms, cites);
        if (inline === false) {
          return (
            <pre className="tutor-code-block">
              <code {...props} className={codeClassName}>{content}</code>
            </pre>
          );
        }
        return <code {...props} className={codeClassName}>{content}</code>;
      },
      table: ({ children: nodeChildren, ...props }: React.ComponentProps<'table'>) => (
        <div className="tutor-table-wrap">
          <table {...props}>{processChildren(nodeChildren, terms, cites)}</table>
        </div>
      ),
      thead: ({ children: nodeChildren, ...props }: React.ComponentProps<'thead'>) => (
        <thead {...props}>{processChildren(nodeChildren, terms, cites)}</thead>
      ),
      tbody: ({ children: nodeChildren, ...props }: React.ComponentProps<'tbody'>) => (
        <tbody {...props}>{processChildren(nodeChildren, terms, cites)}</tbody>
      ),
      tr: ({ children: nodeChildren, ...props }: React.ComponentProps<'tr'>) => (
        <tr {...props}>{processChildren(nodeChildren, terms, cites)}</tr>
      ),
      th: ({ children: nodeChildren, ...props }: React.ComponentProps<'th'>) => (
        <th {...props}>{processChildren(nodeChildren, terms, cites)}</th>
      ),
      td: ({ children: nodeChildren, ...props }: React.ComponentProps<'td'>) => (
        <td {...props}>{processChildren(nodeChildren, terms, cites)}</td>
      ),
      input: (props: React.ComponentProps<'input'>) => <input {...props} />,
    }),
    [terms, cites],
  );

  return (
    <div className={`tutor-prose ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as never}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
