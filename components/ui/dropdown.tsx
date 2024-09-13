import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "./button";
import { Ellipsis } from "lucide-react";

export function Dropdown({ children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger className="focus:outline-none hover:outline-none">
        <Ellipsis className="h-4 w-4" />
      </RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Content className="fixed right-0 top-0 p-2 border rounded-md bg-white shadow-lg focus:outline-none hover:outline-none">
        {children}
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Root>
  )
}

export function DropdownItem({ children, onClick }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <RadixDropdownMenu.Item onClick={onClick} className="focus:outline-none hover:outline-none">
      {children}
    </RadixDropdownMenu.Item>
  )
}
