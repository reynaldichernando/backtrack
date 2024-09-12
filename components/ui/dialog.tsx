import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/80" />

        <div className="fixed bottom-0 left-0 right-0 md:top-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center md:p-4">
            <RadixDialog.Content className="w-full md:max-w-lg transform overflow-hidden rounded-t-xl md:rounded-b-xl bg-white pt-4 pl-4 pr-4 md:pb-4 text-left align-middle shadow-xl transition-all">
              <RadixDialog.Title className="text-lg font-semibold leading-none tracking-tight mb-4">
                {title}
              </RadixDialog.Title>
              <Button
                variant={"ghost"}
                onClick={onClose}
                className="absolute right-1 top-1"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
              {children}
            </RadixDialog.Content>
          </div>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
