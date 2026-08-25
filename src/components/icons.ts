"use client";

/**
 * Barrel de ícones do projeto. Importe SEMPRE daqui, nunca direto de
 * "lucide-react".
 *
 * Motivo: os ícones do lucide são objetos forwardRef sem diretiva
 * "use client". Quando um Server Component renderiza um ícone e ele acaba
 * atravessando a fronteira RSC — o que acontece o tempo todo, porque
 * primitivas como Button/Alert repassam children pra componentes de cliente
 * do base-ui — o React tenta serializar a função `render` do forwardRef e
 * quebra a página inteira com:
 *
 *   Functions cannot be passed directly to Client Components
 *   {$$typeof: ..., render: function Play}
 *
 * Reexportar sob "use client" transforma cada ícone numa client reference,
 * que é serializável, então o mesmo JSX passa a funcionar em Server e em
 * Client Component sem distinção.
 */
export {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Circle,
  CircleCheckIcon,
  CircleDot,
  Clock,
  Crosshair,
  Dices,
  Flag,
  Gauge,
  Goal,
  GraduationCap,
  Hand,
  Info,
  InfoIcon,
  Loader2,
  Loader2Icon,
  Menu,
  OctagonXIcon,
  Pause,
  Play,
  RectangleVertical,
  Repeat,
  ShieldCheck,
  Shirt,
  Shuffle,
  SkipForward,
  Square,
  Star,
  Swords,
  Timer,
  TrendingDown,
  TriangleAlertIcon,
  Trophy,
  UserPlus,
  Users,
  X,
  XIcon,
} from "lucide-react";

export type { LucideIcon } from "lucide-react";
