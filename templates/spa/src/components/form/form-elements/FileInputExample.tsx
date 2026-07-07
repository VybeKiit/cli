import ComponentCard from '../../common/ComponentCard';
import FileInput from '../input/FileInput';
import Label from '../Label';

const FileInputExample = () => {
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

export default FileInputExample;
