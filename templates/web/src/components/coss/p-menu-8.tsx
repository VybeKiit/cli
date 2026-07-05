import { Button } from '@vybekiit/ui/button';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu';

export default function Particle() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuItem closeOnClick={true}>Profile</MenuItem>
        <MenuItem closeOnClick={true}>Settings</MenuItem>
        <MenuItem closeOnClick={true}>Log out</MenuItem>
      </MenuPopup>
    </Menu>
  );
}
