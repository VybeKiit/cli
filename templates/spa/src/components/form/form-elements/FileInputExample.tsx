import { ComponentCard } from '@/components/common/ComponentCard';
import { FileInput } from '@/components/form/input/FileInput';
import { Label } from '@/components/form/Label';

export const FileInputExample = () => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void file.name;
    }
  };

  return (
    <ComponentCard title="File Input">
      <div>
        <Label>Upload file</Label>
        <FileInput onChange={handleFileChange} className="custom-class" />
      </div>
    </ComponentCard>
  );
};
