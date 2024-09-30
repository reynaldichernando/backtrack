import { Drawer as VaulDrawer } from "vaul";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <VaulDrawer.Root open={isOpen} onOpenChange={onClose} repositionInputs={false}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 bg-black/80 z-30" />

        <VaulDrawer.Content className="fixed bottom-0 left-0 right-0 w-full md:max-w-lg rounded-t-xl bg-background pl-6 pr-6 pb-safe-or-10 shadow-xl mx-auto z-30">
          <div>
            <div className="p-3 max-w-20 mx-auto cursor-grab active:cursor-grabbing" onClick={onClose}>
              <div className="rounded-xl h-1 bg-foreground/50"></div>
            </div>
          </div>
          <VaulDrawer.Title className="text-xl font-semibold leading-none tracking-tight my-4">
            {title}
          </VaulDrawer.Title>
          {children}
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}