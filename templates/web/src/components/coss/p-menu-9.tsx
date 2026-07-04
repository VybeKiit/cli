import { Button } from '@/components/ui/button';
import { Menu, MenuCheckboxItem, MenuPopup, MenuTrigger } from '@/components/ui/menu';

export default function Particle() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuCheckboxItem defaultChecked={true} variant="switch">
          Auto save
        </MenuCheckboxItem>
        <MenuCheckboxItem variant="switch">Notifications</MenuCheckboxItem>
        <MenuCheckboxItem defaultChecked={true} variant="switch">
          Dark mode
        </MenuCheckboxItem>
      </MenuPopup>
    </Menu>
  );
}
