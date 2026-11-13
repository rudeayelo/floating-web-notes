import { RichTextKit, TypistEditor } from "@todoist/typist";

type NotePreviewProps = {
  text: string;
};

export const NotePreview = ({ text }: NotePreviewProps) => (
  <TypistEditor
    className="UtilityResultPreview"
    content={text}
    editable={false}
    extensions={[RichTextKit]}
  />
);
