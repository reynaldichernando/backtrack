import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "./button";
import { Ellipsis } from "lucide-react";

export function Dropdown({ children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger>
        <Button size="icon" variant="ghost" type="button">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Content className="absolute right-0 mt-2 p-4 rounded-md bg-white shadow-lg focus:outline-none hover:outline-none">
        {children}
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Root>
  )
}

export function DropdownItem({ children, onClick }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <RadixDropdownMenu.Item onClick={onClick}>
      {children}
    </RadixDropdownMenu.Item>
  )
}
