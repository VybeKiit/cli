import { EditorContent, useEditor, type Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  className?: string;
  placeholder?: string;
}

/** Simplified Tiptap editor for CMS-style content drafts. */
export const RichTextEditor = ({
  value = '',
  onChange,
  className,
  placeholder = 'Start writing…',
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit] as Extensions,
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[200px] px-3 py-2 focus:outline-none',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
  });

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        className,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
};
