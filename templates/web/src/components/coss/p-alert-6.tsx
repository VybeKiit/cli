import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@vybekiit/ui/alert';

export default function Particle() {
  return (
    <Alert variant="warning">
      <TriangleAlertIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>Describe what can be done about it here.</AlertDescription>
    </Alert>
  );
}
