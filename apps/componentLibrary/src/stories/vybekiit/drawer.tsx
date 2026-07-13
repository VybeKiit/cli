'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@vybekiit/ui/drawer';

/** A real bottom-sheet Drawer with header, description, and footer actions. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col items-start gap-2">
      <span className="font-medium text-muted-foreground text-xs">Default</span>
      <Drawer>
        <DrawerTrigger asChild={true}>
          <Button variant="outline">Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move to project</DrawerTitle>
            <DrawerDescription>Select the project you want to move this task to.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2">
            <ul className="space-y-1 text-sm">
              {['Design system', 'Marketing site', 'Mobile app', 'Backend API'].map((project) => (
                <li className="cursor-pointer rounded-md px-3 py-2 hover:bg-muted" key={project}>
                  {project}
                </li>
              ))}
            </ul>
          </div>
          <DrawerFooter>
            <Button>Confirm</Button>
            <DrawerClose asChild={true}>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};

export default story;
