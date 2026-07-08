import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ResponsiveImage from '@/components/tailadmin-ui/images/ResponsiveImage';
import TwoColumnImageGrid from '@/components/tailadmin-ui/images/TwoColumnImageGrid';
import ThreeColumnImageGrid from '@/components/tailadmin-ui/images/ThreeColumnImageGrid';
import ComponentCard from '@/components/common/ComponentCard';
import PageMeta from '@/components/common/PageMeta';

const Images = () => (
  <>
    <PageMeta
      title="React.js Images Dashboard | TailAdmin - React.js Admin Dashboard Template"
      description="This is React.js Images page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
    />
    <PageBreadcrumb pageTitle="Images" />
    <div className="space-y-5 sm:space-y-6">
      <ComponentCard title="Responsive image">
        <ResponsiveImage />
      </ComponentCard>
      <ComponentCard title="Image in 2 Grid">
        <TwoColumnImageGrid />
      </ComponentCard>
      <ComponentCard title="Image in 3 Grid">
        <ThreeColumnImageGrid />
      </ComponentCard>
    </div>
  </>
);

export default Images;
