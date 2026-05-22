'use client';

import { Children, cloneElement, isValidElement, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Term = {
  term: string;
  explanation: string;
};

type TutorMarkdownProps = {
  children: string;
  className?: string;
};

const TERM_PATTERN = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;
const PLACEHOLDER_PATTERN = /⁣TERM(\d+)⁣/g;

function extractTerms(content: string): { markdown: string; terms: Term[] } {
  const terms: Term[] = [];

  const markdown = content.replace(TERM_PATTERN, (_match, term: string, explanation: string) => {
    const index = terms.length;
    terms.push({ term: term.trim(), explanation: explanation.trim() });
    return `⁣TERM${index}⁣`;
  });

  return { markdown, terms };
}

function TermPopover({ term, explanation }: Term) {
  return (
    <details className="tutor-term">
      <summary className="tutor-term-trigger">{term}</summary>
      <div className="tutor-term-popover">
        <p className="tutor-term-title">{term}</p>
        <p className="tutor-term-explanation">{explanation}</p>
      </div>
    </details>
  );
}

function renderPlaceholderText(text: string, terms: Term[]) {
  const nodes: Array<string | React.ReactElement> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    const termIndex = Number(match[1]);
    const term = terms[termIndex];
    if (term) {
      nodes.push(<TermPopover key={`${term.term}-${index}`} {...term} />);
    } else {
      nodes.push(match[0]);
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function processChildren(children: React.ReactNode, terms: Term[]): React.ReactNode {
  return Children.toArray(children).flatMap((child, childIndex) => {
    if (typeof child === 'string') {
      return renderPlaceholderText(child, terms);
    }

    if (typeof child === 'number') {
      return child;
    }

    if (isValidElement(child)) {
      const childProps = child.props as Record<string, unknown>;
      if (childProps.children !== undefined) {
        return cloneElement(child as React.ReactElement<Record<string, unknown>>, {
          key: child.key ?? childIndex,
          children: processChildren(childProps.children as React.ReactNode, terms),
        });
      }
    }

    return child;
  });
}

export default function TutorMarkdown({ children, className = '' }: TutorMarkdownProps) {
  const { markdown, terms } = useMemo(() => extractTerms(children), [children]);

  const components = useMemo(
    () => ({
      h1: ({ children: nodeChildren, ...props }: React.ComponentProps<'h1'>) => (
        <h1 {...props}>{processChildren(nodeChildren, terms)}</h1>
      ),
      h2: ({ children: nodeChildren, ...props }: React.ComponentProps<'h2'>) => (
        <h2 {...props}>{processChildren(nodeChildren, terms)}</h2>
      ),
      h3: ({ children: nodeChildren, ...props }: React.ComponentProps<'h3'>) => (
        <h3 {...props}>{processChildren(nodeChildren, terms)}</h3>
      ),
      p: ({ children: nodeChildren, ...props }: React.ComponentProps<'p'>) => (
        <p {...props}>{processChildren(nodeChildren, terms)}</p>
      ),
      li: ({ children: nodeChildren, ...props }: React.ComponentProps<'li'>) => (
        <li {...props}>{processChildren(nodeChildren, terms)}</li>
      ),
      strong: ({ children: nodeChildren, ...props }: React.ComponentProps<'strong'>) => (
        <strong {...props}>{processChildren(nodeChildren, terms)}</strong>
      ),
      em: ({ children: nodeChildren, ...props }: React.ComponentProps<'em'>) => (
        <em {...props}>{processChildren(nodeChildren, terms)}</em>
      ),
      blockquote: ({ children: nodeChildren, ...props }: React.ComponentProps<'blockquote'>) => (
        <blockquote {...props}>{processChildren(nodeChildren, terms)}</blockquote>
      ),
      a: ({ children: nodeChildren, href, ...props }: React.ComponentProps<'a'>) => (
        <a {...props} href={href} target="_blank" rel="noreferrer">
          {processChildren(nodeChildren, terms)}
        </a>
      ),
      // Block code styling lives here; `code` below handles only the inner element.
      pre: ({ children: nodeChildren, ...props }: React.ComponentProps<'pre'>) => (
        <pre {...props} className="tutor-code-block">{nodeChildren}</pre>
      ),
      code: ({ children: nodeChildren, inline, className: codeClassName, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) => {
        const content = processChildren(nodeChildren, terms);

        // react-markdown v7 passes inline=false for block code; v8+ omits it entirely.
        // When inline is explicitly false, wrap in <pre> (v7 compat path).
        // Otherwise render as bare <code> — block code is already wrapped by the `pre` component.
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
          <table {...props}>{processChildren(nodeChildren, terms)}</table>
        </div>
      ),
      thead: ({ children: nodeChildren, ...props }: React.ComponentProps<'thead'>) => (
        <thead {...props}>{processChildren(nodeChildren, terms)}</thead>
      ),
      tbody: ({ children: nodeChildren, ...props }: React.ComponentProps<'tbody'>) => (
        <tbody {...props}>{processChildren(nodeChildren, terms)}</tbody>
      ),
      tr: ({ children: nodeChildren, ...props }: React.ComponentProps<'tr'>) => (
        <tr {...props}>{processChildren(nodeChildren, terms)}</tr>
      ),
      th: ({ children: nodeChildren, ...props }: React.ComponentProps<'th'>) => (
        <th {...props}>{processChildren(nodeChildren, terms)}</th>
      ),
      td: ({ children: nodeChildren, ...props }: React.ComponentProps<'td'>) => (
        <td {...props}>{processChildren(nodeChildren, terms)}</td>
      ),
    }),
    [terms],
  );

  return (
    <div className={`tutor-prose ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as never}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
