// Type declarations for modules without type definitions

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  // Define common icons used in the project
  export const AlertCircle: FC<IconProps>;
  export const ShieldAlert: FC<IconProps>;
  export const Check: FC<IconProps>;
  export const X: FC<IconProps>;
  export const ChevronDown: FC<IconProps>;
  export const ChevronUp: FC<IconProps>;
  export const Database: FC<IconProps>;
  export const Save: FC<IconProps>;
  export const Copy: FC<IconProps>;
  export const User: FC<IconProps>;
  export const Settings: FC<IconProps>;
  export const LogOut: FC<IconProps>;
  export const Menu: FC<IconProps>;
  export const Home: FC<IconProps>;
  export const FileText: FC<IconProps>;
  export const Server: FC<IconProps>;
  export const MessageSquare: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const Trash: FC<IconProps>;
  export const Edit: FC<IconProps>;
  export const Search: FC<IconProps>;
  export const Upload: FC<IconProps>;
  export const Download: FC<IconProps>;
  export const ExternalLink: FC<IconProps>;
  export const Info: FC<IconProps>;
  export const HelpCircle: FC<IconProps>;
  export const MoreHorizontal: FC<IconProps>;
  export const MoreVertical: FC<IconProps>;
  export const Send: FC<IconProps>;
  
  // Add more icons as needed
}

declare module '@tanstack/react-query' {
  export const QueryClient: any;
  export const QueryClientProvider: any;
}

declare module 'next-themes' {
  export const ThemeProvider: any;
}
