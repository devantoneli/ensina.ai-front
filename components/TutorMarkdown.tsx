'use client';

import { Children, cloneElement, isValidElement, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Term = {
  term: string;
  explanation: string;
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
      h4: ({ children: nodeChildren, ...props }: React.ComponentProps<'h4'>) => (
        <h4 {...props}>{processChildren(nodeChildren, terms)}</h4>
      ),
      p: ({ children: nodeChildren, ref, ...props }: React.ComponentProps<'p'>) => {
        // Render block-level div instead of p to avoid hydration errors when nesting details/summary.
        // The .tutor-p class ensures it retains paragraph styling.
        const { ...divProps } = props as any;
        return (
          <div {...divProps} className={`tutor-p ${props.className || ''}`.trim()}>
            {processChildren(nodeChildren, terms)}
          </div>
        );
      },
      ul: ({ children: nodeChildren, ...props }: React.ComponentProps<'ul'>) => (
        <ul {...props}>{processChildren(nodeChildren, terms)}</ul>
      ),
      ol: ({ children: nodeChildren, ...props }: React.ComponentProps<'ol'>) => (
        <ol {...props}>{processChildren(nodeChildren, terms)}</ol>
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
      hr: (props: React.ComponentProps<'hr'>) => <hr {...props} />,
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
      input: (props: React.ComponentProps<'input'>) => <input {...props} />,
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
