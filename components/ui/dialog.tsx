import { DialogPanel, DialogTitle, Dialog as HeadlessDialog, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
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
    <Transition show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" />
        </TransitionChild>

        <div className="fixed bottom-0 left-0 right-0 md:top-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center md:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-t-lg md:rounded-b-lg bg-white pt-4 pl-4 pr-4 md:pb-4 text-left align-middle shadow-xl transition-all">
                <DialogTitle className="text-lg font-semibold leading-none tracking-tight mb-4">
                  {title}
                </DialogTitle>
                <Button
                  variant={"ghost"}
                  onClick={onClose}
                  className="absolute right-1 top-1"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  )
}
