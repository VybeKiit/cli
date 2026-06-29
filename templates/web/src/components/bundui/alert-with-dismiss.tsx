"use client";

import { useState } from "react";
import { CheckCircle2Icon, XIcon } from "lucide-react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AlertWithDismiss() {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <Alert className="flex items-center justify-between">
      <div className="flex gap-3">
        <CheckCircle2Icon className="mt-0.5 size-4" />
        <AlertTitle>Success! Your changes have been saved</AlertTitle>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={() => setShow(false)}>
        <XIcon />
      </Button>
    </Alert>
  );
}
