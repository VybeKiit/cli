import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

export default function Particle() {
  return (
    <Drawer position="right">
      <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
      <DrawerPopup showCloseButton={true} variant="straight">
        <DrawerHeader>
          <DrawerTitle>Notifications</DrawerTitle>
          <DrawerDescription>This is the description of the drawer.</DrawerDescription>
        </DrawerHeader>
        <DrawerPanel>
          <p className="text-muted-foreground text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris.
          </p>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
}
