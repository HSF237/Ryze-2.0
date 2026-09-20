"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Search,
  Heart,
  ShoppingBag,
  UserRound,
  Headphones,
  Keyboard,
  Lamp,
  Watch,
  Sparkles,
  Menu,
  X,
  Plus,
  Minus,
  SlidersHorizontal,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Package,
  MapPin,
  Settings2,
  Scale,
  Trash2,
  Share2,
  Download,
  Mail,
  MessageCircle,
  LayoutGrid,
  Bookmark,
  Pause,
  Play,
  Eye,
  Star,
  LockKeyhole,
  Bell,
  ExternalLink,
  CheckCheck,
  LoaderCircle,
  Sun,
  Moon,
  Home,
  Compass,
  TicketPercent,
  CreditCard,
  WalletCards,
  LocateFixed,
  Clock3,
  Navigation,
  Tag,
  Gift,
  Trophy,
  Bot,
  Mic,
  Camera,
  ListPlus,
  ThumbsUp,
  PlayCircle,
  CalendarDays,
  Zap,
  Crown,
  Send,
  BarChart3,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster, toast } from "sonner";
import {
  products,
  categories,
  money,
  totals,
  couponOffers,
  voucherOffers,
  couponValid,
  voucherValid,
  type Product,
  type Line,
} from "@/lib/catalog";

type Address = {
  id?: string;
  name: string;
  line: string;
  city: string;
  pin: string;
  phone?: string;
};
type Order = {
  id: string;
  number: string;
  created: number;
  status: string;
  items: (Line & { product: Product; itemStatus?: string })[];
  address: Address;
  coupon?: string;
  voucher?: string;
  mockPayment?: { method: string; simulated: true };
  subtotal: number;
  couponDiscount?: number;
  voucherDiscount?: number;
  discount: number;
  shipping: number;
  total: number;
  paid: false;
  deliverySpeed?: string;
  deliverySlot?: string;
  deliveryInstruction?: string;
  requests?: {
    id: string;
    type: string;
    productId: string;
    reason: string;
    status: string;
    created: number;
  }[];
};
type Voucher = { code: string; claimed: number; usedBy: string | null };
type WishlistCollection = {
  id: string;
  name: string;
  private: boolean;
  items: string[];
  created: number;
};
type SearchRecommendation =
  | { kind: "product"; product: Product; score: number }
  | { kind: "category"; label: string; score: number }
  | { kind: "search"; label: string; score: number };
type Data = {
  user: { name: string; email: string } | null;
  catalog: Product[];
  cart: Line[];
  wishlist: string[];
  wishlistCollections: WishlistCollection[];
  compare: string[];
  recent: string[];
  alerts: string[];
  searches: string[];
  location: { city: string; pin: string } | null;
  vouchers: Voucher[];
  profile: { name?: string; phone?: string };
  addresses: Address[];
  preferences: {
    newsletter?: boolean;
    alerts?: boolean;
    orderUpdates?: boolean;
    deals?: boolean;
    favouriteCategories?: string[];
  };
  rewardProfile: { redeemed?: number; birthday?: string };
  notifications: {
    id: string;
    title: string;
    text: string;
    created: number;
    read: boolean;
    href?: string;
  }[];
  studioConfig: { banner: string; campaign: string };
  orders: Order[];
  tickets: any[];
  reviews: any[];
  questions: any[];
};
const empty: Data = {
  user: null,
  catalog: products,
  cart: [],
  wishlist: [],
  wishlistCollections: [],
  compare: [],
  recent: [],
  alerts: [],
  searches: [],
  location: null,
  vouchers: [],
  profile: {},
  addresses: [],
  preferences: {},
  rewardProfile: { redeemed: 0, birthday: "" },
  notifications: [],
  studioConfig: {
    banner: "Fresh finds. Better everyday.",
    campaign: "RYZE10",
  },
  orders: [],
  tickets: [],
  reviews: [],
  questions: [],
};
const icons: Record<string, any> = {
  "All finds": Sparkles,
  Audio: Headphones,
  Workspace: Keyboard,
  Living: Lamp,
  Wearables: Watch,
};
const blankAddress: Address = {
  name: "",
  line: "",
  city: "",
  pin: "",
  phone: "",
};
const searchIdeas = [
  "Wireless headphones",
  "Portable speakers",
  "Mechanical keyboard",
  "Desk lighting",
  "Smart watches",
  "Silver accessories",
  "Workspace essentials",
  "Living room lighting",
];
function productSearchText(product: Product) {
  return [
    product.name,
    product.category,
    product.tag,
    product.description,
    product.colors.join(" "),
    ...Object.values(product.specs),
  ]
    .join(" ")
    .toLowerCase();
}
const faq = [
  [
    "Is this store taking real orders?",
    "This is the private RYZE shopping preview. The products, prices, stock and imagery are concept examples. You can save a preview order, but no payment is collected and nothing will be dispatched.",
  ],
  [
    "How does delivery work?",
    "The preview calculator uses ₹99 delivery, or free delivery from ₹2,999 after discounts. Actual serviceability, delivery dates and shipping prices must be confirmed with a shipping provider before launch.",
  ],
  [
    "Can I return an item?",
    "Live return and warranty policies have not been configured. Saved preview orders can be cancelled from My orders. No payment or refund is involved.",
  ],
  [
    "Where are my saved items kept?",
    "Your bag, wishlists, addresses and preview orders are saved to your signed-in account. Browser preferences such as colour mode stay on this device.",
  ],
  [
    "Are the product specifications confirmed?",
    "No. These are original product concepts with generated imagery. Confirmed supplier photos, specifications, stock and fulfilment details are needed before real products can be sold.",
  ],
];
const featureGroups = [
  {
    name: "Shopping",
    live: "Dedicated search with history, categories, filters, sorting, product pages, quick view, cart, wishlist, comparison, recently viewed, share links, bundles and mobile navigation",
    next: "Live supplier catalogue, image search, voice search, 3D/AR product assets and multi-currency conversion",
  },
  {
    name: "Account & orders",
    live: "Signed-in profile, saved addresses, delivery location, preview orders, receipts, reorder and honest preview tracking",
    next: "Public customer authentication, courier tracking events, refunds, return labels and email notifications",
  },
  {
    name: "Store operations",
    live: "Private catalogue editing, stock editing, order review, CSV export, support drafts and preview reviews",
    next: "Supplier integrations, stock synchronisation, order routing, tax configuration, role-managed staff access and audit reporting",
  },
  {
    name: "Growth & intelligence",
    live: "Coupons, claimed vouchers, free-delivery calculation, guided product finder, curated collections and saved alerts",
    next: "AI model integration, loyalty accounting, gift cards, referrals, campaign automation and analytics",
  },
  {
    name: "Payments",
    live: "Razorpay-style payment simulation with UPI, card and wallet choices; no financial details or money are collected",
    next: "Merchant-approved live gateway integration, server-side verification, refunds, fraud controls and compliance review",
  },
];
export default function Store({ initialPath = "/" }: { initialPath?: string }) {
  const [path, setPath] = useState(initialPath),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All finds"),
    [budget, setBudget] = useState(6000),
    [sort, setSort] = useState("curated"),
    [inStock, setInStock] = useState(false);
  const [data, setData] = useState<Data>(empty),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [cartOpen, setCartOpen] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [filtersOpen, setFiltersOpen] = useState(false),
    [quick, setQuick] = useState<Product | null>(null),
    [zoom, setZoom] = useState<Product | null>(null),
    [info, setInfo] = useState(""),
    [finder, setFinder] = useState(false);
  const [finderCategory, setFinderCategory] = useState("All finds"),
    [finderBudget, setFinderBudget] = useState("4000"),
    [slide, setSlide] = useState(0),
    [playing, setPlaying] = useState(false),
    [dark, setDark] = useState(false);
  const [coupon, setCoupon] = useState(""),
    [couponDraft, setCouponDraft] = useState(""),
    [voucher, setVoucher] = useState(""),
    [address, setAddress] = useState<Address>(blankAddress),
    [checkoutStep, setCheckoutStep] = useState(1),
    [savedOrder, setSavedOrder] = useState<Order | null>(null),
    [orderKey, setOrderKey] = useState("");
  const [locationCity, setLocationCity] = useState(""),
    [locationPin, setLocationPin] = useState(""),
    [paymentMethod, setPaymentMethod] = useState("UPI"),
    [paymentSimulated, setPaymentSimulated] = useState(false),
    [trackingQuery, setTrackingQuery] = useState("");
  const [qty, setQty] = useState(1),
    [editingProduct, setEditingProduct] = useState<Product | null>(null),
    [accountTab, setAccountTab] = useState("profile"),
    [reviewProduct, setReviewProduct] = useState<Product | null>(null),
    [rating, setRating] = useState(5),
    [pin, setPin] = useState("");
  const [galleryView, setGalleryView] = useState(0),
    [demoPlaying, setDemoPlaying] = useState(false),
    [wishlistName, setWishlistName] = useState(""),
    [wishlistPrivate, setWishlistPrivate] = useState(true),
    [questionDraft, setQuestionDraft] = useState(""),
    [deliverySpeed, setDeliverySpeed] = useState("Standard"),
    [deliverySlot, setDeliverySlot] = useState("Any time"),
    [deliveryInstruction, setDeliveryInstruction] = useState(""),
    [assistantQuery, setAssistantQuery] = useState(""),
    [assistantAnswer, setAssistantAnswer] = useState(""),
    [assistantMatches, setAssistantMatches] = useState<Product[]>([]),
    [voiceListening, setVoiceListening] = useState(false),
    [imageSearchName, setImageSearchName] = useState("");
  const catalog = data.catalog;
  const sum = totals(data.cart, catalog, coupon, voucher);
  const cartCount = data.cart.reduce((s, l) => s + l.qty, 0);
  const selectedProduct = path.startsWith("/product/")
    ? catalog.find((p) => p.id === path.split("/")[2])
    : null;
  const selectedOrder = path.startsWith("/order/")
    ? data.orders.find((o) => o.id === path.split("/")[2])
    : null;
  const rewardPoints = Math.max(
    0,
    Math.floor(
      data.orders
        .filter((o) => o.status !== "Cancelled")
        .reduce((sum, order) => sum + order.total, 0) / 20,
    ) - Number(data.rewardProfile.redeemed || 0),
  );
  const rewardLevel =
    rewardPoints >= 1000 ? "Ultra" : rewardPoints >= 400 ? "Plus" : "Core";
  const recommendationIds = Array.from(
    new Set([...data.wishlist, ...data.recent]),
  );
  const preferredCategories = Array.from(
    new Set(
      recommendationIds
        .map((id) => catalog.find((p) => p.id === id)?.category)
        .filter(Boolean) as string[],
    ),
  );
  const personalisedProducts = catalog
    .filter(
      (p) =>
        preferredCategories.includes(p.category) &&
        !recommendationIds.includes(p.id),
    )
    .concat(catalog.filter((p) => !recommendationIds.includes(p.id)))
    .filter((p, index, all) => all.findIndex((x) => x.id === p.id) === index)
    .slice(0, 4);
  const trackedOrder = data.orders.find(
    (o) => o.number.toLowerCase() === trackingQuery.trim().toLowerCase(),
  );
  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/store");
      const body: any = await r.json();
      if (!r.ok) throw Error(body.error);
      setData({ ...empty, ...body });
      if (body.location) {
        setLocationCity(body.location.city);
        setLocationPin(body.location.pin);
      }
    } catch (e) {
      setError((e as Error).message || "Unable to load saved shopping.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    setOrderKey(crypto.randomUUID());
    const d = localStorage.getItem("ryze-theme") === "dark";
    setDark(d);
    document.documentElement.dataset.theme = d ? "dark" : "light";
    function sync() {
      setPath(location.pathname);
      const q = new URLSearchParams(location.search);
      setQuery(q.get("q") || "");
      setCategory(q.get("category") || "All finds");
      if (location.pathname === "/track")
        setTrackingQuery(q.get("order") || "");
    }
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: any) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: "ryze_find_products",
      title: "Find RYZE products",
      description:
        "Read concept catalogue products matching a name or category. Does not change shopping state.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (input: any) => {
        if (input.query !== undefined && typeof input.query !== "string")
          throw Error("query must be a string");
        const q = (input.query || "").toLowerCase();
        return dataRef.current.catalog
          .filter((p) => (p.name + " " + p.category).toLowerCase().includes(q))
          .map((p) => ({
            id: p.id,
            name: p.name,
            priceINR: p.price,
            category: p.category,
            concept: true,
          }));
      },
    });
    register({
      name: "ryze_set_cart_quantity",
      title: "Set bag quantity",
      description:
        "Save a concept product quantity to the signed-in shopping bag. Quantity zero removes it. Does not place an order or collect payment.",
      inputSchema: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "integer", minimum: 0, maximum: 20 },
        },
        required: ["productId", "quantity"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input: any) => {
        if (
          typeof input.productId !== "string" ||
          !Number.isInteger(input.quantity) ||
          input.quantity < 0 ||
          input.quantity > 20
        )
          throw Error("Invalid product or quantity");
        const result = await mutate({
          action: "cart",
          id: input.productId,
          qty: input.quantity,
        });
        if (!result) throw Error("Bag was not updated");
        return { cart: result.cart };
      },
    });
    return () => lifecycle.abort();
  }, []);
  useEffect(() => {
    if (!playing || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const timer = setInterval(() => setSlide((s) => (s + 1) % 3), 6500);
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (!selectedProduct || !data.user || loading) return;
    fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recent", id: selectedProduct.id }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: any) => {
        if (d) setData((old) => ({ ...old, recent: d.recent }));
      })
      .catch(() => {});
    setQty(1);
  }, [selectedProduct?.id, loading, data.user?.email]);
  useEffect(() => {
    document.title = selectedProduct
      ? selectedProduct.name + " — RYZE STORES"
      : path === "/"
        ? "RYZE STORES — Everyday, upgraded"
        : path
            .slice(1)
            .split("/")[0]
            .replace(/^./, (s) => s.toUpperCase()) + " — RYZE STORES";
  }, [path, selectedProduct]);
  function go(href: string) {
    const u = new URL(href, location.origin);
    history.pushState({}, "", u.pathname + u.search);
    setPath(u.pathname);
    setQuery(u.searchParams.get("q") || "");
    setCategory(u.searchParams.get("category") || "All finds");
    setMenuOpen(false);
    setCartOpen(false);
    setSearchOpen(false);
    setQuick(null);
    setQty(1);
    if (u.pathname === "/checkout") {
      setCheckoutStep(1);
      setSavedOrder(null);
      setPaymentSimulated(false);
      setOrderKey(crypto.randomUUID());
    }
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function link(href: string, children: ReactNode, className = "") {
    return (
      <a
        className={className}
        href={href}
        onClick={(e) => {
          if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            go(href);
          }
        }}
      >
        {children}
      </a>
    );
  }
  async function mutate(payload: any, message?: string) {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    try {
      const r = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: any = await r.json();
      if (!r.ok) {
        if (body.signIn) setInfo("signin");
        throw Error(body.error || "Please try again.");
      }
      const next = { ...dataRef.current, ...body };
      dataRef.current = next;
      setData(next);
      if (message) toast.success(message);
      return body;
    } catch (e) {
      toast.error((e as Error).message);
      return null;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function requireLogin(returnTo = path) {
    if (dataRef.current.user) return true;
    setInfo("signin:" + returnTo);
    return false;
  }
  async function add(p: Product, amount = 1, open = false) {
    if (!requireLogin("/product/" + p.id)) return null;
    const count =
      (dataRef.current.cart.find((l) => l.id === p.id)?.qty || 0) + amount;
    const result = await mutate(
      { action: "cart", id: p.id, qty: count },
      "Added to your bag",
    );
    if (result && open) setCartOpen(true);
    return result;
  }
  async function runSearch(value = query) {
    const clean = value.trim();
    if (clean.length < 2) {
      toast.info("Type at least two characters.");
      return;
    }
    if (data.user) await mutate({ action: "search", query: clean });
    go("/shop?q=" + encodeURIComponent(clean));
  }
  function startVoiceSearch() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info("Voice search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onstart = () => setVoiceListening(true);
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => {
      setVoiceListening(false);
      toast.error("Voice search could not hear that. Try typing instead.");
    };
    recognition.onresult = (event: any) => {
      const value = String(event.results?.[0]?.[0]?.transcript || "").trim();
      if (value) {
        setQuery(value);
        runSearch(value);
      }
    };
    recognition.start();
  }
  function askAssistant(value = assistantQuery) {
    const clean = value.toLowerCase().trim();
    if (clean.length < 3) {
      toast.info("Ask a little more about what you need.");
      return;
    }
    const amount = Number(
      clean
        .match(/(?:₹|rs\.?|under|below)\s*([0-9,]+)/i)?.[1]
        ?.replaceAll(",", "") || 1000000,
    );
    const categoryMatch = categories
      .slice(1)
      .find((c) => clean.includes(c.toLowerCase()));
    const intentWords = clean
      .split(/\W+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !["find", "under", "best", "with", "build", "show", "need"].includes(
            word,
          ),
      );
    const matches = catalog
      .filter((p) => p.price <= amount)
      .filter((p) => !categoryMatch || p.category === categoryMatch)
      .map((p) => ({
        product: p,
        score: intentWords.filter((word) => productSearchText(p).includes(word))
          .length,
      }))
      .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
      .map((x) => x.product)
      .slice(0, 3);
    setAssistantMatches(matches);
    setAssistantAnswer(
      matches.length
        ? `I found ${matches.length} concept ${matches.length === 1 ? "match" : "matches"} for your request. I prioritised your budget, category and product features.`
        : "I could not find a close match in this small concept catalogue. Try a higher budget or a broader category.",
    );
  }
  function changeTheme() {
    const d = !dark;
    setDark(d);
    document.documentElement.dataset.theme = d ? "dark" : "light";
    localStorage.setItem("ryze-theme", d ? "dark" : "light");
  }
  async function share(p?: Product) {
    const url = location.origin + (p ? "/product/" + p.id : path);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      setInfo("share:" + url);
    }
  }
  function download(name: string, text: string, type = "text/plain") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function receipt(o: Order) {
    download(
      o.number + ".txt",
      `RYZE STORES — PREVIEW RECEIPT\n${o.number}\n${new Date(o.created).toLocaleString()}\n\nNo payment collected. No shipment will be created.\n\n${o.items.map((l) => `${l.product.name} × ${l.qty}: ${money(l.product.price * l.qty)}`).join("\n")}\nSubtotal: ${money(o.subtotal)}\nDiscount: ${money(o.discount)}\nShipping estimate: ${money(o.shipping)}\nTotal: ${money(o.total)}\nStatus: ${o.status}`,
    );
  }
  const searchRecommendations = useMemo<SearchRecommendation[]>(() => {
    const clean = query.toLowerCase().trim();
    if (!clean) return [];
    const words = clean.split(/\s+/).filter(Boolean);
    const scoreText = (text: string) => {
      const value = text.toLowerCase();
      if (value.startsWith(clean)) return 100;
      if (value.includes(clean)) return 80;
      if (words.every((word) => value.includes(word))) return 60;
      if (words.some((word) => value.includes(word))) return 30;
      return 0;
    };
    const productMatches: SearchRecommendation[] = catalog
      .map((product) => ({
        kind: "product" as const,
        product,
        score:
          scoreText(product.name) +
          Math.round(scoreText(productSearchText(product)) / 2),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    const categoryMatches: SearchRecommendation[] = categories
      .slice(1)
      .map((label) => ({
        kind: "category" as const,
        label,
        score: scoreText(label),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 1);
    const ideaMatches: SearchRecommendation[] = searchIdeas
      .map((label) => ({
        kind: "search" as const,
        label,
        score: scoreText(label),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    return [...productMatches, ...categoryMatches, ...ideaMatches].slice(0, 7);
  }, [catalog, query]);
  const filtered = useMemo(() => {
    const corrected = query
      .toLowerCase()
      .replace(/headfone|headphon|hedphone/g, "headphone")
      .replace(/speker|speeker/g, "speaker")
      .replace(/keybord|keybaord/g, "keyboard")
      .replace(/wach|watcch/g, "watch");
    const priceMatch = corrected.match(/(?:under|below|₹|rs\.?)\s*([0-9,]+)/);
    const queryBudget = priceMatch
      ? Number(priceMatch[1].replaceAll(",", ""))
      : 1000000;
    const words = corrected
      .replace(/(?:under|below|₹|rs\.?)\s*[0-9,]+/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return catalog
      .filter(
        (p) =>
          (category === "All finds" || p.category === category) &&
          p.price <= Math.min(budget, queryBudget) &&
          (!inStock || p.stock > 0) &&
          words.every((w) => productSearchText(p).includes(w)),
      )
      .sort((a, b) =>
        sort === "low"
          ? a.price - b.price
          : sort === "high"
            ? b.price - a.price
            : sort === "name"
              ? a.name.localeCompare(b.name)
              : 0,
      );
  }, [catalog, category, budget, sort, query, inStock]);
  function catTabs() {
    return (
      <div className="category-tabs">
        {categories.map((c) => {
          const Icon = icons[c];
          return (
            <button
              key={c}
              className={category === c ? "active" : ""}
              onClick={() => {
                setCategory(c);
                const u = new URL(location.href);
                c === "All finds"
                  ? u.searchParams.delete("category")
                  : u.searchParams.set("category", c);
                history.replaceState({}, "", u.pathname + u.search);
              }}
            >
              <Icon size={16} />
              {c}
            </button>
          );
        })}
      </div>
    );
  }
  function productCard(p: Product) {
    return (
      <article className="product-card" key={p.id}>
        <div className="product-image">
          {link(
            "/product/" + p.id,
            <img src={p.image} alt={p.name} loading="lazy" />,
          )}
          <span className="product-tag">{p.tag}</span>
          <button
            className={
              "wish-button " + (data.wishlist.includes(p.id) ? "saved" : "")
            }
            disabled={busy}
            onClick={() => mutate({ action: "wishlist", id: p.id })}
            aria-label={
              (data.wishlist.includes(p.id) ? "Remove from" : "Add to") +
              " wishlist: " +
              p.name
            }
          >
            <Heart
              size={17}
              fill={data.wishlist.includes(p.id) ? "currentColor" : "none"}
            />
          </button>
          <div className="card-hover">
            <button onClick={() => setQuick(p)}>
              <Eye size={15} /> Quick view
            </button>
            <button
              aria-label={"Compare " + p.name}
              className={data.compare.includes(p.id) ? "selected" : ""}
              disabled={busy}
              onClick={() => mutate({ action: "compare", id: p.id })}
            >
              <Scale size={15} />
            </button>
          </div>
        </div>
        <div className="product-info">
          <small>
            {p.category} <span>CONCEPT</span>
          </small>
          <h3>{link("/product/" + p.id, p.name)}</h3>
          <div className="price-row">
            <strong>{money(p.price)}</strong>
            <button
              aria-label={"Add " + p.name + " to bag"}
              onClick={() => add(p)}
              disabled={busy || p.stock === 0}
            >
              {p.stock === 0 ? <span>Sold out</span> : <Plus size={18} />}
            </button>
          </div>
        </div>
      </article>
    );
  }
  function sectionTitle(eyebrow: string, title: string, sub?: string) {
    return (
      <div className="page-heading">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    );
  }
  function emptyState(icon: ReactNode, title: string, text: string) {
    return (
      <div className="empty-state">
        <span>{icon}</span>
        <h2>{title}</h2>
        <p>{text}</p>
        {link(
          "/shop",
          <>
            Find something good <ArrowUpRight size={17} />
          </>,
          "btn primary",
        )}
      </div>
    );
  }
  function summary() {
    return (
      <div className="order-summary">
        <h3>Your order summary</h3>
        <div>
          <span>Subtotal</span>
          <strong>{money(sum.subtotal)}</strong>
        </div>
        {sum.couponDiscount > 0 && (
          <div className="blue-text">
            <span>{coupon} coupon</span>
            <strong>−{money(sum.couponDiscount)}</strong>
          </div>
        )}
        {sum.voucherDiscount > 0 && (
          <div className="blue-text">
            <span>{voucher} voucher</span>
            <strong>−{money(sum.voucherDiscount)}</strong>
          </div>
        )}
        <div>
          <span>Delivery estimate</span>
          <strong>{sum.shipping ? money(sum.shipping) : "Free"}</strong>
        </div>
        <div className="total">
          <span>Total</span>
          <strong>{money(sum.total)}</strong>
        </div>
        <small>Preview prices. The mock payment never collects money.</small>
      </div>
    );
  }
  function couponBox() {
    return (
      <div className="offer-entry">
        <form
          className="coupon-row"
          onSubmit={(e) => {
            e.preventDefault();
            const code = couponDraft.trim().toUpperCase();
            if (couponValid(code, data.cart, catalog)) {
              setCoupon(code);
              toast.success(code + " applied");
            } else
              toast.error(
                "That code is not eligible for this bag. Open Offers to check the conditions.",
              );
          }}
        >
          <input
            aria-label="Coupon code"
            placeholder="Coupon code"
            value={couponDraft}
            onChange={(e) => setCouponDraft(e.target.value)}
          />
          <button type="submit">Apply</button>
          {coupon && (
            <button
              type="button"
              aria-label="Remove coupon"
              onClick={() => {
                setCoupon("");
                setCouponDraft("");
              }}
            >
              <X size={15} />
            </button>
          )}
        </form>
        <button className="text-link" onClick={() => go("/offers")}>
          See coupons & vouchers
        </button>
        {data.vouchers.filter((v) => !v.usedBy).length > 0 && (
          <Select
            value={voucher}
            onValueChange={(v) => {
              if (voucherValid(v, data.cart, catalog)) {
                setVoucher(v);
                toast.success("Voucher applied");
              } else
                toast.error(
                  "This voucher is not eligible for the current bag.",
                );
            }}
          >
            <SelectTrigger
              className="full"
              aria-label="Choose a claimed voucher"
            >
              <SelectValue placeholder="Choose a claimed voucher" />
            </SelectTrigger>
            <SelectContent>
              {data.vouchers
                .filter((v) => !v.usedBy)
                .map((v) => (
                  <SelectItem key={v.code} value={v.code}>
                    {v.code}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }
  function bagLines() {
    return (
      <div className="bag-lines">
        {data.cart.map((l) => {
          const p = catalog.find((p) => p.id === l.id);
          if (!p) return null;
          return (
            <div className="bag-line" key={l.id}>
              <img src={p.image} alt={p.name} />
              <div>
                <h3>{link("/product/" + p.id, p.name)}</h3>
                <small>{l.color}</small>
                <strong>{money(p.price * l.qty)}</strong>
                <div className="line-controls">
                  <div className="qty">
                    <button
                      aria-label="Decrease quantity"
                      disabled={busy}
                      onClick={() =>
                        mutate({ action: "cart", id: p.id, qty: l.qty - 1 })
                      }
                    >
                      <Minus size={13} />
                    </button>
                    <span>{l.qty}</span>
                    <button
                      aria-label="Increase quantity"
                      disabled={busy || l.qty >= p.stock || l.qty >= 20}
                      onClick={() =>
                        mutate({ action: "cart", id: p.id, qty: l.qty + 1 })
                      }
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    title="Save for later"
                    disabled={busy}
                    onClick={async () => {
                      if (!data.wishlist.includes(p.id)) {
                        const r = await mutate({
                          action: "wishlist",
                          id: p.id,
                        });
                        if (!r) return;
                      }
                      await mutate(
                        { action: "cart", id: p.id, qty: 0 },
                        "Saved to your wishlist",
                      );
                    }}
                  >
                    <Bookmark size={15} />
                  </button>
                  <button
                    aria-label={"Remove " + p.name}
                    disabled={busy}
                    onClick={() => mutate({ action: "cart", id: p.id, qty: 0 })}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  const slides = [
    {
      eyebrow: "THE EVERYDAY, UPGRADED",
      title: (
        <>
          Find your
          <br />
          next <em>obsession.</em>
        </>
      ),
      copy: (
        <>
          Clever tech. Considered essentials.
          <br />
          Unexpected finds, all in one place.
        </>
      ),
      image: "/images/headphones.webp",
      product: catalog[0],
      label: "AURA / STUDIO SERIES",
    },
    {
      eyebrow: "MAKE SPACE FOR BETTER",
      title: (
        <>
          Good space.
          <br />
          <em>Great energy.</em>
        </>
      ),
      copy: (
        <>
          A desk that does more than work.
          <br />
          Make your everyday a little brighter.
        </>
      ),
      image: "/images/desk.webp",
      product: catalog[1],
      label: "THE SETUP EDIT / 01",
    },
    {
      eyebrow: "SMALL THINGS. BIG FEELING.",
      title: (
        <>
          Your rhythm.
          <br />
          <em>Reimagined.</em>
        </>
      ),
      copy: (
        <>
          Bold colour. Fresh perspective.
          <br />
          Find the details that feel like you.
        </>
      ),
      image: "/images/speaker.webp",
      product: catalog[2],
      label: "PULSE / COLOUR SERIES",
    },
  ];
  const current = slides[slide];
  return (
    <div className="store-root">
      <Toaster position="bottom-right" richColors closeButton />
      <div className="announcement">
        A little different. A lot more you.{" "}
        <button onClick={() => go("/collections")}>
          Meet the new RYZE <ArrowUpRight size={13} />
        </button>
        <span className="preview-label">PRIVATE PREVIEW</span>
      </div>
      <header className="header">
        {link(
          "/",
          <>
            RYZE<span>STORES</span>
          </>,
          "brand",
        )}
        <nav aria-label="Main navigation">
          {link("/shop", "Discover", path === "/shop" ? "nav-active" : "")}
          {link("/shop?category=Audio", "Tech & audio")}
          {link("/shop?category=Living", "Home & living")}
          {link(
            "/collections",
            <>
              The edit <Sparkles size={13} />
            </>,
          )}
          {link(
            "/offers",
            <>
              Offers <TicketPercent size={13} />
            </>,
          )}
        </nav>
        <div className="header-actions">
          <button aria-label="Search products" onClick={() => go("/search")}>
            <Search />
          </button>
          {link(
            "/wishlist",
            <>
              <Heart />
              <span className="sr-only">Wishlist</span>
              {data.wishlist.length > 0 && <i>{data.wishlist.length}</i>}
            </>,
          )}
          {link(
            "/account",
            <>
              <UserRound />
              <span className="sr-only">My account</span>
            </>,
          )}
          <button
            aria-label={"Shopping bag, " + cartCount + " items"}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag />
            <i key={cartCount}>{cartCount}</i>
          </button>
          <button
            className="mobile-menu"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </button>
        </div>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          {error} <button onClick={load}>Retry</button>
        </div>
      )}
      <main className="shell" key={path}>
        {path === "/" && (
          <>
            <div className="home-tools">
              <button
                className="home-location"
                onClick={() => setInfo("location")}
              >
                <LocateFixed size={18} />
                <span>
                  <small>Delivering to</small>
                  <strong>
                    {data.location
                      ? data.location.city + " " + data.location.pin
                      : "Choose your location"}
                  </strong>
                </span>
                <ChevronRight size={16} />
              </button>
              <button className="home-search" onClick={() => go("/search")}>
                <Search size={19} />
                <span>Search RYZE STORES</span>
              </button>
            </div>
            <div className="intro-line">
              <span>GOOD FINDS. GREAT ENERGY.</span>
              <span>India · INR ₹</span>
            </div>
            <section className="hero">
              <div className="hero-copy" key={"copy" + slide}>
                <div className="eyebrow">
                  <span className="pill-dot" />
                  {current.eyebrow}
                </div>
                <h1>{current.title}</h1>
                <p>{current.copy}</p>
                {link(
                  "/shop",
                  <>
                    Explore the collection <ArrowUpRight size={18} />
                  </>,
                  "btn primary",
                )}
                <div className="hero-bottom">
                  <span>CURATED FOR YOUR EVERYDAY</span>
                  <div className="slide-controls">
                    <button
                      aria-label="Previous collection"
                      onClick={() => setSlide((s) => (s + 2) % 3)}
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span>0{slide + 1} / 03</span>
                    <button
                      aria-label="Next collection"
                      onClick={() => setSlide((s) => (s + 1) % 3)}
                    >
                      <ChevronRight size={15} />
                    </button>
                    <button
                      aria-label={playing ? "Pause carousel" : "Play carousel"}
                      onClick={() => setPlaying(!playing)}
                    >
                      {playing ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="hero-art">
                <img
                  key={current.image}
                  src={current.image}
                  alt={current.product.name + " concept showcase"}
                  fetchPriority="high"
                />
                <span className="art-label">{current.label}</span>
                {link(
                  "/product/" + current.product.id,
                  <>
                    <div>
                      <small>YOUR WORLD. YOUR WAY.</small>
                      <strong>
                        {current.product.name
                          .replace(" Headphones", "")
                          .replace(" Keyboard", "")}
                      </strong>
                      <span>{money(current.product.price)}</span>
                    </div>
                    <span className="circle">
                      <ArrowUpRight />
                    </span>
                  </>,
                  "floating-card",
                )}
              </div>
            </section>
            <div className="benefits">
              <span>
                <Sparkles size={15} />
                Thoughtful finds
              </span>
              <span>
                <Package size={15} />
                Everyday essentials
              </span>
              <span>
                <ShieldCheck size={15} />
                Your own shopping space
              </span>
              <button onClick={() => setFinder(true)}>
                Find your fit <ArrowUpRight size={15} />
              </button>
            </div>
            <section className="home-banners" aria-label="Store highlights">
              <button
                className="promo-banner promo-offers"
                onClick={() => go("/offers")}
              >
                <TicketPercent />
                <span>
                  <small>RYZE REWARDS</small>
                  <strong>Coupons & vouchers</strong>
                  <em>Claim a voucher for your preview bag</em>
                </span>
                <ArrowUpRight />
              </button>
              <button
                className="promo-banner promo-track"
                onClick={() => go("/track")}
              >
                <Navigation />
                <span>
                  <small>ORDER NOTEBOOK</small>
                  <strong>Track my order</strong>
                  <em>Check the state of a saved preview</em>
                </span>
                <ArrowUpRight />
              </button>
              <button
                className="promo-banner promo-wish"
                onClick={() => go("/wishlist")}
              >
                <Heart />
                <span>
                  <small>KEEP IT CLOSE</small>
                  <strong>Your wishlist</strong>
                  <em>Save finds and return anytime</em>
                </span>
                <ArrowUpRight />
              </button>
            </section>
            {data.user && (
              <section className="personalised-home">
                <div className="personalised-head">
                  <div>
                    <div className="eyebrow">MADE FOR YOUR RYZE</div>
                    <h2>
                      Welcome back,{" "}
                      {data.profile.name || data.user.name || "Hasan"}.
                    </h2>
                    <p>
                      Continue shopping, revisit saved finds and discover picks
                      shaped by your activity.
                    </p>
                  </div>
                  <div className="member-chip">
                    <Crown size={18} />
                    <span>
                      <strong>{rewardLevel}</strong>
                      {rewardPoints} points
                    </span>
                  </div>
                </div>
                <div className="personalised-actions">
                  <button onClick={() => go("/wallet")}>
                    <WalletCards />
                    <span>
                      <strong>RYZE Wallet</strong>
                      <small>Vouchers, credit & activity</small>
                    </span>
                    <ArrowUpRight />
                  </button>
                  <button onClick={() => go("/rewards")}>
                    <Trophy />
                    <span>
                      <strong>Rewards</strong>
                      <small>Level up and unlock benefits</small>
                    </span>
                    <ArrowUpRight />
                  </button>
                  <button onClick={() => go("/assistant")}>
                    <Bot />
                    <span>
                      <strong>Shopping assistant</strong>
                      <small>Build a setup within budget</small>
                    </span>
                    <ArrowUpRight />
                  </button>
                  <button onClick={() => go("/notifications")}>
                    <Bell />
                    <span>
                      <strong>Updates</strong>
                      <small>
                        {data.notifications.filter((n) => !n.read).length}{" "}
                        unread notifications
                      </small>
                    </span>
                    <ArrowUpRight />
                  </button>
                </div>
                {(data.recent.length > 0 || data.wishlist.length > 0) && (
                  <div className="personalised-products">
                    <div className="section-head">
                      <h3>Inspired by your activity</h3>
                      {link("/wishlist", "View saved finds")}
                    </div>
                    <div className="product-grid">
                      {personalisedProducts.map(productCard)}
                    </div>
                  </div>
                )}
              </section>
            )}
            <section className="catalog-section">
              <div className="section-head">
                <div className="eyebrow">THE GOOD STUFF</div>
                {link(
                  "/shop",
                  <>
                    View all finds <ArrowUpRight size={16} />
                  </>,
                )}
              </div>
              <div className="section-title">
                <h2>Meet your next favourites.</h2>
                <p>A fresh perspective on everyday essentials.</p>
              </div>
              {catTabs()}
              <div className="product-grid">
                {catalog
                  .filter(
                    (p) => category === "All finds" || p.category === category,
                  )
                  .slice(0, 4)
                  .map(productCard)}
              </div>
            </section>
            <section className="edit-banner">
              <img
                src="/images/desk.webp"
                alt="Generated editorial scene of a silver and blue desk setup"
                loading="lazy"
              />
              <div>
                <div className="eyebrow">THE SETUP EDIT / 01</div>
                <h2>
                  A space that
                  <br />
                  feels like you.
                </h2>
                <p>Little upgrades. A whole new perspective.</p>
                {link(
                  "/collections",
                  <>
                    Explore the edit <ArrowUpRight size={18} />
                  </>,
                  "btn light",
                )}
              </div>
            </section>
            <section className="discovery-row">
              <div>
                <div className="eyebrow">LESS SEARCHING. MORE FINDING.</div>
                <h2>
                  Good taste.
                  <br />
                  Meet good tech.
                </h2>
                <p>
                  Tell us your mood and budget.
                  <br />
                  We’ll narrow down the collection.
                </p>
                <button className="text-link" onClick={() => setFinder(true)}>
                  Find my next upgrade <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="discovery-cards">
                {[catalog[2], catalog[4]].map((p) => (
                  <a
                    key={p.id}
                    href={"/product/" + p.id}
                    onClick={(e) => {
                      e.preventDefault();
                      go("/product/" + p.id);
                    }}
                  >
                    <img src={p.image} alt={p.name} loading="lazy" />
                    <span>
                      {p.category}
                      <ArrowUpRight size={16} />
                    </span>
                  </a>
                ))}
              </div>
            </section>
            {data.recent.length > 0 && (
              <section className="catalog-section">
                <div className="section-title">
                  <h2>Worth another look.</h2>
                </div>
                <div className="product-grid mt-6">
                  {data.recent
                    .map((id) => catalog.find((p) => p.id === id))
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((p) => productCard(p!))}
                </div>
              </section>
            )}
            <section className="newsletter">
              <div>
                <div className="eyebrow">STAY A LITTLE AHEAD</div>
                <h2>Fresh finds. First look.</h2>
                <p>Save your preference for updates when the store launches.</p>
              </div>
              <button
                className="btn primary"
                disabled={busy}
                onClick={() =>
                  mutate(
                    {
                      action: "preferences",
                      ...data.preferences,
                      newsletter: !data.preferences.newsletter,
                    },
                    data.preferences.newsletter
                      ? "Preference removed"
                      : "Preference saved. Emails are not enabled yet.",
                  )
                }
              >
                {data.preferences.newsletter
                  ? "You’re on the list"
                  : "Keep me in the loop"}
                {data.preferences.newsletter ? (
                  <Check size={18} />
                ) : (
                  <ArrowUpRight size={18} />
                )}
              </button>
            </section>
          </>
        )}
        {path === "/search" && (
          <>
            {sectionTitle(
              "SEARCH RYZE",
              "What are you looking for?",
              "Search products, revisit recent searches, then refine the results with filters.",
            )}
            <section className="search-page">
              <div className="search-autocomplete">
                <form
                  className="search-hero"
                  onSubmit={(e) => {
                    e.preventDefault();
                    runSearch();
                  }}
                >
                  <Search size={23} />
                  <input
                    autoFocus
                    aria-label="Search RYZE STORES"
                    aria-expanded={!!query.trim()}
                    aria-controls="live-search-recommendations"
                    autoComplete="off"
                    placeholder="Try headphones, workspace or lamp…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Clear"
                      onClick={() => setQuery("")}
                    >
                      <X size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={voiceListening ? "voice-active" : ""}
                    aria-label="Search by voice"
                    onClick={startVoiceSearch}
                  >
                    <Mic size={18} />
                  </button>
                  <button className="btn primary" type="submit">
                    Search <ArrowRight size={17} />
                  </button>
                </form>
                {query.trim() && (
                  <div
                    className="recommendation-panel"
                    id="live-search-recommendations"
                    aria-label="Search recommendations"
                  >
                    <div className="recommendation-label">
                      <Sparkles size={15} /> Recommended for “{query.trim()}”
                    </div>
                    {searchRecommendations.length ? (
                      searchRecommendations.map((recommendation) =>
                        recommendation.kind === "product" ? (
                          <button
                            type="button"
                            className="recommendation-product"
                            key={"product-" + recommendation.product.id}
                            onClick={() =>
                              go("/product/" + recommendation.product.id)
                            }
                          >
                            <img src={recommendation.product.image} alt="" />
                            <span>
                              <strong>{recommendation.product.name}</strong>
                              <small>{recommendation.product.category}</small>
                            </span>
                            <b>{money(recommendation.product.price)}</b>
                            <ArrowUpRight size={16} />
                          </button>
                        ) : recommendation.kind === "category" ? (
                          <button
                            type="button"
                            className="recommendation-query"
                            key={"category-" + recommendation.label}
                            onClick={() =>
                              go(
                                "/shop?category=" +
                                  encodeURIComponent(recommendation.label),
                              )
                            }
                          >
                            <Compass size={17} />
                            <span>
                              Browse <strong>{recommendation.label}</strong>
                            </span>
                            <ArrowRight size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="recommendation-query"
                            key={"search-" + recommendation.label}
                            onClick={() => runSearch(recommendation.label)}
                          >
                            <Search size={17} />
                            <span>{recommendation.label}</span>
                            <ArrowRight size={16} />
                          </button>
                        ),
                      )
                    ) : (
                      <p className="recommendation-empty">
                        No exact suggestion yet. Search the full catalogue
                        instead.
                      </p>
                    )}
                    <button
                      type="button"
                      className="recommendation-all"
                      onClick={() => runSearch()}
                    >
                      <Search size={17} /> Search all products for “
                      {query.trim()}”
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="search-power-tools">
                <label>
                  <Camera size={17} />
                  <span>{imageSearchName || "Search using an image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImageSearchName(file.name);
                      const guessed = searchIdeas.find((idea) =>
                        file.name
                          .toLowerCase()
                          .split(/[-_. ]/)
                          .some((word) => idea.toLowerCase().includes(word)),
                      );
                      if (guessed) setQuery(guessed);
                      toast.info(
                        "Image selected. Visual recognition needs a production image-search provider; filename and catalogue suggestions are shown for now.",
                      );
                    }}
                  />
                </label>
                <span>
                  <Zap size={15} />
                  Trending:
                </span>
                {["Aura headphones", "Desk setup", "Under ₹3,000"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setQuery(item);
                        runSearch(item);
                      }}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
              <div className="search-columns">
                <div className="panel search-history">
                  <div className="section-head">
                    <h2>
                      <Clock3 size={19} /> Recent searches
                    </h2>
                    {data.searches.length > 0 && (
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() =>
                          mutate(
                            { action: "clearSearch" },
                            "Search history cleared",
                          )
                        }
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {data.searches.length ? (
                    data.searches.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setQuery(s);
                          runSearch(s);
                        }}
                      >
                        <Clock3 size={15} /> {s} <ArrowUpRight size={15} />
                      </button>
                    ))
                  ) : (
                    <p className="muted">
                      Your signed-in search history will appear here.
                    </p>
                  )}
                </div>
                <div className="panel search-suggestions">
                  <h2>Explore popular searches</h2>
                  <div>
                    {[
                      "Wireless audio",
                      "Desk setup",
                      "Smart watches",
                      "Ambient lighting",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setQuery(s);
                          runSearch(s);
                        }}
                      >
                        <Tag size={15} /> {s}
                      </button>
                    ))}
                  </div>
                  <h3>Browse categories</h3>
                  <div>
                    {categories.slice(1).map((c) => (
                      <button
                        key={c}
                        onClick={() =>
                          go("/shop?category=" + encodeURIComponent(c))
                        }
                      >
                        {c} <ArrowUpRight size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
        {path === "/shop" && (
          <>
            {sectionTitle(
              "DISCOVER RYZE",
              query ? "Results for “" + query + "”" : "Everyday, upgraded.",
              "Thoughtful tech and considered essentials. Explore the concept collection.",
            )}
            <form
              className="shop-search"
              onSubmit={(e) => {
                e.preventDefault();
                go("/shop?q=" + encodeURIComponent(query));
              }}
            >
              <Search size={19} />
              <input
                aria-label="Search catalogue"
                placeholder="Find your next favourite…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X size={17} />
                </button>
              )}
            </form>
            {catTabs()}
            <div className="filter-row">
              <button
                className="btn secondary"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal size={16} />
                Filters{" "}
                {(budget < 6000 || inStock) && (
                  <span className="count">
                    {Number(budget < 6000) + Number(inStock)}
                  </span>
                )}
              </button>
              <span>{filtered.length} finds</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger aria-label="Sort products">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="curated">Curated order</SelectItem>
                  <SelectItem value="low">Price: low to high</SelectItem>
                  <SelectItem value="high">Price: high to low</SelectItem>
                  <SelectItem value="name">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(budget < 6000 || inStock) && (
              <div className="active-filters">
                {budget < 6000 && (
                  <button onClick={() => setBudget(6000)}>
                    Under {money(budget)} <X size={12} />
                  </button>
                )}
                {inStock && (
                  <button onClick={() => setInStock(false)}>
                    Available <X size={12} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setBudget(6000);
                    setInStock(false);
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
            {filtered.length ? (
              <div className="product-grid catalog-page">
                {filtered.map(productCard)}
              </div>
            ) : (
              emptyState(
                <Search />,
                "No finds just yet.",
                "Try a broader search, another category or a higher budget.",
              )
            )}
            <p className="catalog-note">
              Original concept products and sample prices. This private preview
              does not accept payments.
            </p>
          </>
        )}
        {path.startsWith("/product/") &&
          (selectedProduct ? (
            <>
              <div className="breadcrumbs">
                {link("/", "Home")}
                <ChevronRight size={12} />
                {link("/shop", "Discover")}
                <ChevronRight size={12} />
                <span>{selectedProduct.name}</span>
              </div>
              <section className="product-detail">
                <div className="detail-gallery">
                  <button
                    className={
                      "detail-main gallery-view-" +
                      galleryView +
                      (demoPlaying ? " demo-playing" : "")
                    }
                    aria-label="Enlarge product image"
                    onClick={() =>
                      demoPlaying
                        ? setDemoPlaying(false)
                        : setZoom(selectedProduct)
                    }
                  >
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                    />
                    <span>
                      {demoPlaying ? <Pause size={17} /> : <Plus size={17} />}
                      {demoPlaying
                        ? " Pause motion demo"
                        : " Explore the details"}
                    </span>
                  </button>
                  <div className="gallery-thumbs" aria-label="Product gallery">
                    {["Full view", "Detail crop", "Lifestyle crop"].map(
                      (label, index) => (
                        <button
                          key={label}
                          className={galleryView === index ? "active" : ""}
                          onClick={() => {
                            setGalleryView(index);
                            setDemoPlaying(false);
                          }}
                          aria-label={label}
                        >
                          <img src={selectedProduct.image} alt="" />
                          <span>{label}</span>
                        </button>
                      ),
                    )}
                    <button
                      className={
                        demoPlaying ? "active motion-thumb" : "motion-thumb"
                      }
                      onClick={() => setDemoPlaying(!demoPlaying)}
                    >
                      <PlayCircle />
                      <span>Motion demo</span>
                    </button>
                  </div>
                  <div className="gallery-caption">
                    <span>0{galleryView + 1} / Generated product concept</span>
                    <button onClick={() => share(selectedProduct)}>
                      <Share2 size={15} /> Share
                    </button>
                  </div>
                </div>
                <div className="detail-copy">
                  <div className="eyebrow">
                    {selectedProduct.category} / {selectedProduct.tag}
                  </div>
                  <h1>{selectedProduct.name}</h1>
                  <p>{selectedProduct.description}</p>
                  <div className="detail-price">
                    {money(selectedProduct.price)}
                    <span>Sample price · concept product</span>
                  </div>
                  <div className="variant">
                    <span>Finish</span>
                    <div className="variant-options">
                      {selectedProduct.colors
                        .concat(
                          selectedProduct.colors.length === 1
                            ? ["RYZE custom preview"]
                            : [],
                        )
                        .map((color, index) => (
                          <button className="variant-chip" key={color}>
                            <i
                              style={{ filter: `hue-rotate(${index * 75}deg)` }}
                            />
                            {color}
                            {index === 0 && <Check size={13} />}
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="stock-note">
                    {selectedProduct.stock > 0
                      ? selectedProduct.stock + " units in preview inventory"
                      : "Out of stock in preview inventory"}
                  </div>
                  <div className="purchase-row">
                    <div className="qty">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                      >
                        <Minus size={15} />
                      </button>
                      <span>{qty}</span>
                      <button
                        aria-label="Increase quantity"
                        disabled={qty >= selectedProduct.stock || qty >= 20}
                        onClick={() => setQty((q) => q + 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      className="btn primary"
                      disabled={busy || selectedProduct.stock === 0}
                      onClick={() => add(selectedProduct, qty, true)}
                    >
                      <ShoppingBag size={18} />
                      Add to bag
                    </button>
                    <button
                      className={
                        "icon-btn " +
                        (data.wishlist.includes(selectedProduct.id)
                          ? "saved"
                          : "")
                      }
                      aria-label="Toggle wishlist"
                      disabled={busy}
                      onClick={() =>
                        mutate({ action: "wishlist", id: selectedProduct.id })
                      }
                    >
                      <Heart
                        fill={
                          data.wishlist.includes(selectedProduct.id)
                            ? "currentColor"
                            : "none"
                        }
                        size={20}
                      />
                    </button>
                  </div>
                  <button
                    className="btn outlined full"
                    disabled={busy || selectedProduct.stock === 0}
                    onClick={async () => {
                      const r = await add(selectedProduct, qty);
                      if (r) go("/checkout");
                    }}
                  >
                    Preview checkout <ArrowRight size={17} />
                  </button>
                  <div className="detail-actions">
                    <button
                      disabled={busy}
                      onClick={() =>
                        mutate({ action: "compare", id: selectedProduct.id })
                      }
                    >
                      <Scale size={15} />
                      {data.compare.includes(selectedProduct.id)
                        ? "Remove comparison"
                        : "Compare"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        mutate(
                          { action: "alerts", id: selectedProduct.id },
                          "Alert preference saved; notifications are not connected yet.",
                        )
                      }
                    >
                      <Bell size={15} />
                      {data.alerts.includes(selectedProduct.id)
                        ? "Alert saved"
                        : "Save a price alert"}
                    </button>
                  </div>
                  {!!data.wishlistCollections.length && (
                    <div className="save-to-lists">
                      <span>Save to a list</span>
                      <div>
                        {data.wishlistCollections.map((list) => (
                          <button
                            key={list.id}
                            disabled={busy}
                            className={
                              list.items.includes(selectedProduct.id)
                                ? "active"
                                : ""
                            }
                            onClick={() =>
                              mutate(
                                {
                                  action: "wishlistCollection",
                                  op: "toggle",
                                  listId: list.id,
                                  id: selectedProduct.id,
                                },
                                list.items.includes(selectedProduct.id)
                                  ? "Removed from list"
                                  : "Saved to " + list.name,
                              )
                            }
                          >
                            <Bookmark size={14} /> {list.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="detail-promise">
                    <LockKeyhole size={18} />
                    <p>
                      <strong>Explore with confidence</strong>
                      <br />
                      No payment taken. No real order placed.
                    </p>
                  </div>
                  <form
                    className="pin-check"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (/^\d{6}$/.test(pin))
                        toast.info(
                          "PIN format accepted. Live delivery serviceability is not connected yet.",
                        );
                      else toast.error("Enter a six-digit Indian PIN code.");
                    }}
                  >
                    <MapPin size={17} />
                    <input
                      placeholder="Delivery PIN code"
                      aria-label="Delivery PIN code"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      inputMode="numeric"
                      maxLength={6}
                    />
                    <button>Check</button>
                  </form>
                  {/^\d{6}$/.test(pin) && (
                    <div className="delivery-promise-card">
                      <Truck size={19} />
                      <div>
                        <strong>Estimated preview delivery</strong>
                        <span>
                          {new Date(
                            Date.now() + 5 * 86400000,
                          ).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                          –
                          {new Date(
                            Date.now() + 7 * 86400000,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <small>
                          Illustrative only · courier serviceability is not
                          connected
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              </section>
              <div className="mobile-sticky-buy">
                <div>
                  <strong>{money(selectedProduct.price)}</strong>
                  <small>{selectedProduct.name}</small>
                </div>
                <button
                  className="btn primary"
                  disabled={busy || selectedProduct.stock === 0}
                  onClick={() => add(selectedProduct, qty, true)}
                >
                  <ShoppingBag size={17} />
                  Add to bag
                </button>
              </div>
              <Tabs defaultValue="details" className="product-tabs">
                <TabsList variant="line">
                  <TabsTrigger value="details">The details</TabsTrigger>
                  <TabsTrigger value="specs">Specifications</TabsTrigger>
                  <TabsTrigger value="reviews">
                    Reviews (
                    {
                      data.reviews.filter((r) => r.id === selectedProduct.id)
                        .length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="delivery">Delivery & returns</TabsTrigger>
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <div className="detail-tab-content">
                    <h2>Designed to fit your everyday.</h2>
                    <p>{selectedProduct.description}</p>
                    <p>
                      This is an original product concept with generated
                      imagery. Supplier specifications, included accessories and
                      warranty terms must be confirmed before launch.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="specs">
                  <Table>
                    <TableBody>
                      {Object.entries(selectedProduct.specs).map(([k, v]) => (
                        <TableRow key={k}>
                          <TableCell>{k}</TableCell>
                          <TableCell>{v}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="muted">
                    Concept attributes only; no certified performance claims.
                  </p>
                </TabsContent>
                <TabsContent value="reviews">
                  <div className="detail-tab-content">
                    <h2>Your preview review</h2>
                    <p>
                      Private feedback for exploring the review experience.
                      These are not verified-purchase reviews.
                    </p>
                    {data.reviews
                      .filter((r) => r.id === selectedProduct.id)
                      .map((r) => (
                        <div className="review" key={r.id}>
                          <div>
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                          </div>
                          <p>{r.message}</p>
                          <small>{r.status} · Signed-in preview reviewer</small>
                          <div className="review-actions">
                            <span>Was this helpful?</span>
                            <button
                              onClick={() =>
                                mutate({
                                  action: "reviewVote",
                                  id: r.id,
                                  helpful: true,
                                })
                              }
                            >
                              <ThumbsUp size={14} /> {r.helpful || 0}
                            </button>
                          </div>
                        </div>
                      ))}
                    <button
                      className="btn outlined"
                      onClick={() => setReviewProduct(selectedProduct)}
                    >
                      Write a preview review
                    </button>
                  </div>
                </TabsContent>
                <TabsContent value="delivery">
                  <div className="detail-tab-content">
                    <h2>A clear journey, from bag to doorstep.</h2>
                    <p>
                      Live delivery, returns and warranty policies are not
                      configured. This preview uses an illustrative ₹99 shipping
                      estimate, free from ₹2,999 after discounts. No goods are
                      shipped.
                    </p>
                    {link("/help", "Explore the help centre", "text-link")}
                  </div>
                </TabsContent>
                <TabsContent value="questions">
                  <div className="detail-tab-content product-questions">
                    <h2>Questions about this concept</h2>
                    <p>
                      Ask about fit, finish or intended use. Answers remain
                      preview guidance until supplier details are confirmed.
                    </p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!requireLogin("/product/" + selectedProduct.id))
                          return;
                        const r = await mutate(
                          {
                            action: "question",
                            id: selectedProduct.id,
                            question: questionDraft,
                          },
                          "Question saved",
                        );
                        if (r) setQuestionDraft("");
                      }}
                    >
                      <input
                        value={questionDraft}
                        onChange={(e) => setQuestionDraft(e.target.value)}
                        minLength={8}
                        maxLength={300}
                        required
                        placeholder="Ask a product question…"
                      />
                      <button className="btn primary" disabled={busy}>
                        <Send size={16} />
                        Ask
                      </button>
                    </form>
                    <div className="question-list">
                      {data.questions
                        .filter((q) => q.productId === selectedProduct.id)
                        .map((q) => (
                          <article key={q.id}>
                            <strong>Q: {q.question}</strong>
                            <p>A: {q.answer}</p>
                            <small>{q.status}</small>
                          </article>
                        ))}
                      {!data.questions.some(
                        (q) => q.productId === selectedProduct.id,
                      ) && (
                        <p className="muted">
                          No questions yet. Be the first to ask.
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <section className="recommendation-zone">
                <div className="section-title">
                  <h2>Frequently bought together.</h2>
                  <p>Complete your setup with complementary concepts.</p>
                </div>
                <div className="bundle-recommendations">
                  {catalog
                    .filter((p) => p.id !== selectedProduct.id)
                    .sort(
                      (a, b) =>
                        Number(b.category === selectedProduct.category) -
                        Number(a.category === selectedProduct.category),
                    )
                    .slice(0, 3)
                    .map(productCard)}
                  <aside>
                    <Sparkles />
                    <h3>Complete your setup</h3>
                    <p>Add this recommended bundle to your bag in one tap.</p>
                    <strong>
                      {money(
                        catalog
                          .filter((p) => p.id !== selectedProduct.id)
                          .slice(0, 2)
                          .reduce(
                            (sum, p) => sum + p.price,
                            selectedProduct.price,
                          ),
                      )}
                    </strong>
                    <button
                      className="btn primary"
                      onClick={async () => {
                        for (const product of [
                          selectedProduct,
                          ...catalog
                            .filter((p) => p.id !== selectedProduct.id)
                            .slice(0, 2),
                        ]) {
                          const r = await add(product);
                          if (!r) return;
                        }
                        setCartOpen(true);
                      }}
                    >
                      Add bundle <Plus size={16} />
                    </button>
                  </aside>
                </div>
                <div className="section-title secondary-recs">
                  <h2>Customers also explored.</h2>
                  <p>Similar finds from the RYZE concept catalogue.</p>
                </div>
                <div className="product-grid mt-6">
                  {catalog
                    .filter((p) => p.id !== selectedProduct.id)
                    .slice(0, 4)
                    .map(productCard)}
                </div>
              </section>
            </>
          ) : (
            emptyState(
              <Search />,
              "That find isn’t here.",
              "Explore the collection for something new.",
            )
          ))}
        {path === "/collections" && (
          <>
            {sectionTitle(
              "THE RYZE EDIT",
              "A little more you.",
              "Considered combinations for whatever your day looks like.",
            )}
            <section className="collection-hero">
              <img
                src="/images/desk.webp"
                alt="Concept scene: a thoughtfully arranged workspace"
              />
              <div>
                <div className="eyebrow">THE SETUP EDIT / 01</div>
                <h2>Find your flow.</h2>
                <p>
                  A fresh desk. A clear mind.
                  <br />
                  Build a setup that makes space for you.
                </p>
                <button
                  className="btn light"
                  onClick={() =>
                    document
                      .getElementById("setup")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Shop the edit <ArrowRight size={17} />
                </button>
              </div>
            </section>
            <section className="catalog-section" id="setup">
              <div className="section-title">
                <h2>Your space, upgraded.</h2>
                <p>Select the pieces that belong in your day.</p>
              </div>
              <div className="product-grid mt-6">
                {catalog
                  .filter((p) => ["type", "arc", "pulse"].includes(p.id))
                  .map(productCard)}
              </div>
              <div className="bundle-panel">
                <div>
                  <h3>The complete desk edit</h3>
                  <p>
                    Type One + Arc Lamp + Pulse Mini ·{" "}
                    {money(
                      catalog
                        .filter((p) => ["type", "arc", "pulse"].includes(p.id))
                        .reduce((s, p) => s + p.price, 0),
                    )}
                  </p>
                </div>
                <button
                  className="btn primary"
                  disabled={busy}
                  onClick={async () => {
                    for (const p of catalog.filter((p) =>
                      ["type", "arc", "pulse"].includes(p.id),
                    )) {
                      const r = await add(p);
                      if (!r) return;
                    }
                    setCartOpen(true);
                  }}
                >
                  Add the edit <Plus size={17} />
                </button>
              </div>
            </section>
            <div className="collection-links">
              {["Audio", "Living", "Wearables"].map((c) => {
                const p = catalog.find((p) => p.category === c)!;
                return link(
                  "/shop?category=" + c,
                  <>
                    <img src={p.image} alt={c + " concept collection"} />
                    <div>
                      <h2>
                        {c === "Audio"
                          ? "Set your soundtrack."
                          : c === "Living"
                            ? "Lighten your everyday."
                            : "Keep your own pace."}
                      </h2>
                      <span>
                        Explore {c.toLowerCase()} <ArrowUpRight size={19} />
                      </span>
                    </div>
                  </>,
                  "collection-link",
                );
              })}
            </div>
          </>
        )}
        {path === "/wishlist" && (
          <>
            {sectionTitle(
              "SAVED FOR YOU",
              "Your favourites, together.",
              data.wishlist.length + " finds worth coming back to.",
            )}
            {data.wishlist.length ? (
              <div className="product-grid catalog-page">
                {catalog
                  .filter((p) => data.wishlist.includes(p.id))
                  .map(productCard)}
              </div>
            ) : (
              emptyState(
                <Heart />,
                "A little room for your favourites.",
                "Tap the heart on a product to keep it here.",
              )
            )}
            {data.alerts.length > 0 && (
              <section className="panel">
                <h2>Saved price alerts</h2>
                <p className="muted">
                  Your preferences are saved. Notifications will need to be
                  connected before alerts can be delivered.
                </p>
                {catalog
                  .filter((p) => data.alerts.includes(p.id))
                  .map((p) => (
                    <div className="setting-row" key={p.id}>
                      <span>{p.name}</span>
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() => mutate({ action: "alerts", id: p.id })}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </section>
            )}
            <section className="panel wishlist-lists">
              <div className="section-head">
                <div>
                  <div className="eyebrow">SMART LISTS</div>
                  <h2>Organise your next upgrades.</h2>
                </div>
              </div>
              <form
                className="inline-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const result = await mutate(
                    {
                      action: "wishlistCollection",
                      op: "create",
                      name: wishlistName,
                      private: wishlistPrivate,
                    },
                    "Wishlist created",
                  );
                  if (result) setWishlistName("");
                }}
              >
                <input
                  value={wishlistName}
                  onChange={(e) => setWishlistName(e.target.value)}
                  minLength={2}
                  maxLength={40}
                  required
                  placeholder="Desk setup, Gift ideas…"
                />
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={wishlistPrivate}
                    onChange={(e) => setWishlistPrivate(e.target.checked)}
                  />
                  Private
                </label>
                <button className="btn primary" disabled={busy}>
                  <ListPlus size={17} /> Create list
                </button>
              </form>
              <div className="smart-list-grid">
                {data.wishlistCollections.map((list) => (
                  <article key={list.id}>
                    <div className="section-head">
                      <div>
                        <h3>{list.name}</h3>
                        <small>
                          {list.items.length} items ·{" "}
                          {list.private ? "Private" : "Shareable"}
                        </small>
                      </div>
                      <button
                        className="icon-btn"
                        aria-label={"Delete " + list.name}
                        onClick={() =>
                          mutate(
                            {
                              action: "wishlistCollection",
                              op: "delete",
                              listId: list.id,
                            },
                            "List removed",
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mini-products">
                      {list.items.slice(0, 4).map((id) => {
                        const product = catalog.find((p) => p.id === id);
                        return product ? (
                          <img
                            key={id}
                            src={product.image}
                            alt={product.name}
                          />
                        ) : null;
                      })}
                      {!list.items.length && (
                        <p className="muted">
                          Add products from their product page.
                        </p>
                      )}
                    </div>
                    <div className="list-actions">
                      <button
                        onClick={() =>
                          mutate(
                            {
                              action: "wishlistCollection",
                              op: "privacy",
                              listId: list.id,
                              private: !list.private,
                            },
                            "List privacy updated",
                          )
                        }
                      >
                        {list.private ? "Make shareable" : "Make private"}
                      </button>
                      <button
                        disabled={list.private}
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            location.origin + "/wishlist",
                          );
                          toast.success("Wishlist link copied");
                        }}
                      >
                        Share
                      </button>
                      <button
                        disabled={!list.items.length || busy}
                        onClick={async () => {
                          for (const id of list.items) {
                            const product = catalog.find((p) => p.id === id);
                            if (product && !(await add(product))) return;
                          }
                          setCartOpen(true);
                        }}
                      >
                        Move all to bag
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
        {path === "/wallet" && (
          <>
            {sectionTitle(
              "RYZE WALLET",
              "Value, clearly organised.",
              "Preview vouchers, store credit and reward activity in one place.",
            )}
            <div className="wallet-hero">
              <div>
                <small>AVAILABLE PREVIEW VALUE</small>
                <strong>
                  {money(
                    data.vouchers
                      .filter((v) => !v.usedBy)
                      .reduce(
                        (s, v) =>
                          s +
                          (voucherOffers.find((offer) => offer.code === v.code)
                            ?.code === "SETUP400"
                            ? 400
                            : 250),
                        0,
                      ),
                  )}
                </strong>
                <span>Voucher balance · no cash value</span>
              </div>
              <WalletCards size={64} />
            </div>
            <div className="stat-grid">
              <div>
                <Gift />
                <strong>{data.vouchers.filter((v) => !v.usedBy).length}</strong>
                <span>Active vouchers</span>
              </div>
              <div>
                <Zap />
                <strong>{money(0)}</strong>
                <span>Store credit</span>
              </div>
              <div>
                <Trophy />
                <strong>{rewardPoints}</strong>
                <span>Reward points</span>
              </div>
            </div>
            <section className="panel">
              <div className="section-head">
                <h2>Wallet activity</h2>
                {link("/offers", "Find offers")}
              </div>
              {data.vouchers.length ? (
                data.vouchers.map((v) => (
                  <div className="setting-row" key={v.code}>
                    <span>
                      <strong>{v.code}</strong>
                      <p>{v.usedBy ? "Used" : "Ready at preview checkout"}</p>
                    </span>
                    <strong>{money(v.code === "SETUP400" ? 400 : 250)}</strong>
                  </div>
                ))
              ) : (
                <p className="muted">
                  Claim a voucher in the Deals Centre to see it here.
                </p>
              )}
              <p className="aside-note">
                <ShieldCheck size={16} /> Wallet balances are preview-only and
                cannot be withdrawn or transferred.
              </p>
            </section>
          </>
        )}
        {path === "/rewards" && (
          <>
            {sectionTitle(
              "RYZE REWARDS",
              "Your loyalty, levelled up.",
              "Earn deterministic preview points—never random prizes or pay-to-play mechanics.",
            )}
            <section className="rewards-hero">
              <Crown size={46} />
              <div>
                <small>CURRENT LEVEL</small>
                <h2>{rewardLevel}</h2>
                <p>{rewardPoints} points earned from saved preview orders</p>
              </div>
              <Progress
                value={Math.min(
                  100,
                  rewardLevel === "Ultra"
                    ? 100
                    : rewardPoints / (rewardLevel === "Plus" ? 10 : 5),
                )}
              />
            </section>
            <div className="reward-levels">
              {[
                { n: "Core", p: "0+", b: "Member-only edits" },
                { n: "Plus", p: "500+", b: "Early previews" },
                { n: "Ultra", p: "1,000+", b: "Priority support drafts" },
              ].map((x) => (
                <article
                  className={rewardLevel === x.n ? "active" : ""}
                  key={x.n}
                >
                  <Trophy />
                  <h3>{x.n}</h3>
                  <strong>{x.p} points</strong>
                  <p>{x.b}</p>
                </article>
              ))}
            </div>
            <section className="panel">
              <h2>Reward missions</h2>
              {[
                "Create a wishlist",
                "Save your first preview order",
                "Complete your profile",
              ].map((mission, i) => (
                <div className="setting-row" key={mission}>
                  <span>
                    <strong>{mission}</strong>
                    <p>One-time preview mission</p>
                  </span>
                  <span>+{[25, 100, 50][i]} pts</span>
                </div>
              ))}
              <label>
                Birthday reward reminder
                <input
                  type="date"
                  defaultValue={data.rewardProfile.birthday}
                  onChange={(e) =>
                    mutate(
                      { action: "rewardProfile", birthday: e.target.value },
                      "Birthday preference saved",
                    )
                  }
                />
              </label>
              <p className="muted">
                Points and benefits are illustrative until a real rewards
                programme launches.
              </p>
            </section>
          </>
        )}
        {path === "/deals" && (
          <>
            {sectionTitle(
              "DEALS CENTRE",
              "Good timing. Better finds.",
              "Transparent preview offers with no fake urgency.",
            )}
            <div className="deal-grid">
              {catalog.slice(0, 6).map((p) => (
                <article key={p.id}>
                  {link("/product/" + p.id, <img src={p.image} alt={p.name} />)}
                  <small>{p.category.toUpperCase()} OFFER</small>
                  <h3>{p.name}</h3>
                  <p>
                    <strong>{money(p.price)}</strong>
                  </p>
                  <span>Check eligible coupons below</span>
                </article>
              ))}
            </div>
            <section className="panel">
              <h2>Coupon eligibility</h2>
              {couponOffers.map((c) => (
                <div className="setting-row" key={c.code}>
                  <span>
                    <strong>{c.code}</strong>
                    <p>
                      {c.title} · minimum {money(c.minimum)}
                    </p>
                  </span>
                  <span
                    className={
                      couponValid(c.code, data.cart, catalog)
                        ? "status"
                        : "status cancelled"
                    }
                  >
                    {couponValid(c.code, data.cart, catalog)
                      ? "Eligible"
                      : c.minimum > sum.subtotal
                        ? money(c.minimum - sum.subtotal) + " more"
                        : "Add an eligible item"}
                  </span>
                </div>
              ))}
              <p className="muted">
                Upcoming campaigns appear here only after a real schedule is
                configured.
              </p>
            </section>
          </>
        )}
        {path === "/assistant" && (
          <>
            {sectionTitle(
              "RYZE ASSISTANT",
              "Describe it. Discover it.",
              "A transparent, rule-based catalogue helper for this preview.",
            )}
            <section className="assistant-shell">
              <Bot size={42} />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  askAssistant();
                }}
              >
                <input
                  value={assistantQuery}
                  onChange={(e) => setAssistantQuery(e.target.value)}
                  placeholder="Find headphones under ₹4,000"
                  required
                />
                <button className="btn primary">
                  <Send size={17} /> Ask RYZE
                </button>
              </form>
              <div className="assistant-prompts">
                {[
                  "Build a desk setup under ₹8,000",
                  "Show portable audio",
                  "Compare smart accessories",
                ].map((x) => (
                  <button
                    key={x}
                    onClick={() => {
                      setAssistantQuery(x);
                      askAssistant(x);
                    }}
                  >
                    {x}
                  </button>
                ))}
              </div>
              {assistantAnswer && (
                <div className="assistant-answer">
                  <Sparkles />
                  <p>{assistantAnswer}</p>
                </div>
              )}
            </section>
            {!!assistantMatches.length && (
              <div className="product-grid catalog-page">
                {assistantMatches.map(productCard)}
              </div>
            )}
          </>
        )}
        {path === "/notifications" && (
          <>
            {sectionTitle(
              "UPDATES",
              "Nothing important gets lost.",
              "Order, deal and wishlist activity collected in one calm feed.",
            )}
            <section className="panel notification-list">
              <div className="section-head">
                <h2>Notification centre</h2>
                <button
                  className="text-link"
                  onClick={() =>
                    mutate({ action: "notificationsRead" }, "Marked as read")
                  }
                >
                  Mark all read
                </button>
              </div>
              {data.notifications.length ? (
                data.notifications.map((n) => (
                  <article className={n.read ? "" : "unread"} key={n.id}>
                    <Bell />
                    <div>
                      <strong>{n.title || "RYZE update"}</strong>
                      <p>{n.text}</p>
                      <small>
                        {new Date(n.created).toLocaleString("en-IN")}
                      </small>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">You’re all caught up.</p>
              )}
            </section>
          </>
        )}
        {path === "/compare" && (
          <>
            {sectionTitle(
              "SIDE BY SIDE",
              "Find your better fit.",
              "Compare up to three finds before choosing your favourite.",
            )}
            {data.compare.length ? (
              <div className="comparison">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Compare finds</TableHead>
                      {catalog
                        .filter((p) => data.compare.includes(p.id))
                        .map((p) => (
                          <TableHead key={p.id}>
                            <img src={p.image} alt={p.name} />
                            <h3>{link("/product/" + p.id, p.name)}</h3>
                            <button
                              className="text-link"
                              disabled={busy}
                              onClick={() =>
                                mutate({ action: "compare", id: p.id })
                              }
                            >
                              Remove
                            </button>
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      "Price",
                      "Category",
                      "Finish",
                      "Design",
                      "Preview stock",
                    ].map((k) => (
                      <TableRow key={k}>
                        <TableCell>{k}</TableCell>
                        {catalog
                          .filter((p) => data.compare.includes(p.id))
                          .map((p) => (
                            <TableCell key={p.id}>
                              {k === "Price"
                                ? money(p.price)
                                : k === "Category"
                                  ? p.category
                                  : k === "Preview stock"
                                    ? p.stock
                                    : p.specs[k] || "Not specified"}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>Make it yours</TableCell>
                      {catalog
                        .filter((p) => data.compare.includes(p.id))
                        .map((p) => (
                          <TableCell key={p.id}>
                            <button
                              className="btn primary"
                              disabled={busy || p.stock === 0}
                              onClick={() => add(p, 1, true)}
                            >
                              Add to bag
                            </button>
                          </TableCell>
                        ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              emptyState(
                <Scale />,
                "Good decisions start here.",
                "Use the comparison icon on a product card to add your first find.",
              )
            )}
          </>
        )}
        {path === "/offers" && (
          <>
            {sectionTitle(
              "RYZE REWARDS",
              "More value. Still only a preview.",
              "Apply coupons to your bag or claim a one-use voucher. These rewards do not have cash value.",
            )}
            <section className="offers-layout">
              <div>
                <div className="section-head">
                  <h2>Coupon codes</h2>
                  <span>Apply directly to your bag</span>
                </div>
                <div className="offer-grid">
                  {couponOffers.map((offer) => (
                    <article
                      className="reward-card coupon-card"
                      key={offer.code}
                    >
                      <span className="reward-icon">
                        <TicketPercent />
                      </span>
                      <small>COUPON</small>
                      <h2>{offer.code}</h2>
                      <p>
                        {offer.title} · {offer.description}
                      </p>
                      <button
                        className="btn outlined"
                        onClick={() => {
                          setCouponDraft(offer.code);
                          setCoupon(offer.code);
                          go("/cart");
                        }}
                      >
                        Apply to bag <ArrowRight size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
              <div>
                <div className="section-head">
                  <h2>Voucher wallet</h2>
                  <span>Claim once, use once</span>
                </div>
                <div className="offer-grid">
                  {voucherOffers.map((offer) => {
                    const claimed = data.vouchers.find(
                      (v) => v.code === offer.code,
                    );
                    return (
                      <article
                        className="reward-card voucher-card"
                        key={offer.code}
                      >
                        <span className="reward-icon">
                          <WalletCards />
                        </span>
                        <small>VOUCHER</small>
                        <h2>{offer.code}</h2>
                        <p>
                          {offer.title} · {offer.description}
                        </p>
                        <button
                          className="btn primary"
                          disabled={busy || !!claimed}
                          onClick={() =>
                            requireLogin("/offers") &&
                            mutate(
                              { action: "claimVoucher", code: offer.code },
                              "Voucher added to your wallet",
                            )
                          }
                        >
                          {claimed?.usedBy
                            ? "Used"
                            : claimed
                              ? "In your wallet"
                              : "Claim voucher"}
                          {!claimed && <Plus size={16} />}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
        {path === "/track" && (
          <>
            {sectionTitle(
              "TRACK MY ORDER",
              "Where is your preview?",
              "Look up a saved preview order. RYZE does not create real shipments yet.",
            )}
            <section className="track-layout">
              <div className="panel track-search">
                <Navigation size={28} />
                <h2>Enter your preview order number</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    go(
                      "/track?order=" +
                        encodeURIComponent(trackingQuery.trim()),
                    );
                  }}
                >
                  <input
                    aria-label="Preview order number"
                    placeholder="Example: RYZE-123456"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                  />
                  <button className="btn primary">
                    Track <ArrowRight size={16} />
                  </button>
                </form>
                {data.orders.length > 0 && (
                  <div className="saved-order-chips">
                    <span>Your saved orders</span>
                    {data.orders.slice(0, 4).map((o) => (
                      <button
                        key={o.id}
                        onClick={() => {
                          setTrackingQuery(o.number);
                          go("/track?order=" + encodeURIComponent(o.number));
                        }}
                      >
                        {o.number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {trackingQuery && trackedOrder && (
                <div className="panel tracking-card">
                  <div className="tracking-head">
                    <div>
                      <small>{trackedOrder.number}</small>
                      <h2>{trackedOrder.status}</h2>
                    </div>
                    <strong>{money(trackedOrder.total)}</strong>
                  </div>
                  {trackedOrder.status === "Cancelled" ? (
                    <div className="tracking-cancelled">
                      <X />
                      <div>
                        <h3>Preview cancelled</h3>
                        <p>
                          This saved preview is closed. No payment or shipment
                          was created.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="tracking-timeline">
                      <div className="done">
                        <span>
                          <Check />
                        </span>
                        <div>
                          <strong>Preview saved</strong>
                          <small>
                            Your order details are stored in your account.
                          </small>
                        </div>
                      </div>
                      <div className="done">
                        <span>
                          <CreditCard />
                        </span>
                        <div>
                          <strong>Mock payment simulated</strong>
                          <small>
                            {trackedOrder.mockPayment?.method || "Demo"} · no
                            money collected
                          </small>
                        </div>
                      </div>
                      <div>
                        <span>
                          <Package />
                        </span>
                        <div>
                          <strong>Dispatch</strong>
                          <small>
                            Not started — fulfilment is not connected.
                          </small>
                        </div>
                      </div>
                      <div>
                        <span>
                          <Truck />
                        </span>
                        <div>
                          <strong>In transit</strong>
                          <small>No courier or tracking events exist.</small>
                        </div>
                      </div>
                      <div>
                        <span>
                          <MapPin />
                        </span>
                        <div>
                          <strong>Delivered</strong>
                          <small>
                            No parcel will be delivered from this preview.
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="tracking-note">
                    <ShieldCheck size={18} />
                    This is an honest product demo, not a live shipment tracker.
                  </div>
                </div>
              )}
              {trackingQuery && !trackedOrder && (
                <div className="panel no-track">
                  <Search />
                  <h2>No matching preview order</h2>
                  <p>
                    Check the number or choose one of your saved orders above.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
        {(path === "/cart" || path === "/checkout") && (
          <>
            {sectionTitle(
              path === "/checkout"
                ? "ONE STEP CLOSER"
                : "YOUR EVERYDAY, UPGRADED",
              path === "/checkout" ? "Make it yours." : "Your shopping bag.",
              path === "/checkout"
                ? "Explore checkout with a saved preview order. No payment will be taken."
                : cartCount +
                    " considered " +
                    (cartCount === 1 ? "find" : "finds") +
                    ".",
            )}
            {savedOrder && path === "/checkout" ? (
              <div className="order-success">
                <CheckCircle2 size={64} />
                <div className="eyebrow">PREVIEW SAVED</div>
                <h2>That’s a good-looking bag.</h2>
                <p>{savedOrder.number} is saved to your account.</p>
                <p>No payment was collected. Nothing will be dispatched.</p>
                <div>
                  {link(
                    "/orders",
                    <>
                      View my orders <ArrowRight size={17} />
                    </>,
                    "btn primary",
                  )}
                  <button
                    className="btn outlined"
                    onClick={() => receipt(savedOrder)}
                  >
                    <Download size={17} />
                    Preview receipt
                  </button>
                </div>
              </div>
            ) : data.cart.length ? (
              <div className="checkout-layout">
                <div>
                  {path === "/cart" ? (
                    <>
                      {bagLines()}
                      <button className="text-link" onClick={() => share()}>
                        <Share2 size={15} />
                        Copy bag page link
                      </button>
                      <p className="muted small">
                        Your bag remains private to your account.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="checkout-steps">
                        <button
                          className={checkoutStep === 1 ? "active" : ""}
                          onClick={() => setCheckoutStep(1)}
                        >
                          1 <span>Delivery</span>
                        </button>
                        <ChevronRight size={15} />
                        <button
                          className={checkoutStep === 2 ? "active" : ""}
                          onClick={() => {
                            if (
                              address.name &&
                              address.line &&
                              address.city &&
                              /^\d{6}$/.test(address.pin)
                            )
                              setCheckoutStep(2);
                            else
                              toast.info(
                                "Complete your delivery address first.",
                              );
                          }}
                        >
                          2 <span>Review</span>
                        </button>
                        <ChevronRight size={15} />
                        <button
                          className={checkoutStep === 3 ? "active" : ""}
                          onClick={() => {
                            if (checkoutStep >= 2) setCheckoutStep(3);
                            else toast.info("Review your preview first.");
                          }}
                        >
                          3 <span>Mock payment</span>
                        </button>
                      </div>
                      {checkoutStep === 1 ? (
                        <form
                          className="panel form-stack"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setCheckoutStep(2);
                          }}
                        >
                          <h2>Where would it go?</h2>
                          {data.addresses.length > 0 && (
                            <Select
                              onValueChange={(v) =>
                                setAddress(
                                  data.addresses.find((a) => a.id === v)!,
                                )
                              }
                            >
                              <SelectTrigger
                                className="full"
                                aria-label="Use a saved address"
                              >
                                <SelectValue placeholder="Choose a saved address" />
                              </SelectTrigger>
                              <SelectContent>
                                {data.addresses.map((a) => (
                                  <SelectItem value={a.id!} key={a.id}>
                                    {a.name} — {a.city}, {a.pin}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {addressFields(address, setAddress)}
                          <div className="delivery-options">
                            <label>
                              Delivery speed
                              <Select
                                value={deliverySpeed}
                                onValueChange={setDeliverySpeed}
                              >
                                <SelectTrigger className="full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Standard">
                                    Standard · 5–7 days
                                  </SelectItem>
                                  <SelectItem value="Express">
                                    Express · 2–3 days (preview)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </label>
                            <label>
                              Preferred slot
                              <Select
                                value={deliverySlot}
                                onValueChange={setDeliverySlot}
                              >
                                <SelectTrigger className="full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Any time">
                                    Any time
                                  </SelectItem>
                                  <SelectItem value="Morning">
                                    Morning · 8 AM–12 PM
                                  </SelectItem>
                                  <SelectItem value="Afternoon">
                                    Afternoon · 12–5 PM
                                  </SelectItem>
                                  <SelectItem value="Evening">
                                    Evening · 5–9 PM
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </label>
                          </div>
                          <label>
                            Delivery instructions
                            <textarea
                              rows={3}
                              maxLength={240}
                              value={deliveryInstruction}
                              onChange={(e) =>
                                setDeliveryInstruction(e.target.value)
                              }
                              placeholder="Leave at the door, call on arrival…"
                            />
                          </label>
                          <button
                            type="button"
                            className="text-link"
                            onClick={() =>
                              setAddress({
                                name: "Preview Customer",
                                line: "123 Example Street",
                                city: "Kannur",
                                pin: "670001",
                                phone: "",
                              })
                            }
                          >
                            Use sample address
                          </button>
                          <button className="btn primary" type="submit">
                            Continue to review <ArrowRight size={17} />
                          </button>
                        </form>
                      ) : checkoutStep === 2 ? (
                        <div className="panel">
                          <h2>Review your preview</h2>
                          <div className="address-review">
                            <MapPin size={19} />
                            <p>
                              <strong>{address.name}</strong>
                              <br />
                              {address.line}
                              <br />
                              {address.city}, {address.pin}
                            </p>
                            <button
                              className="text-link"
                              onClick={() => setCheckoutStep(1)}
                            >
                              Edit
                            </button>
                          </div>
                          {bagLines()}
                          <div className="preview-payment">
                            <LockKeyhole size={23} />
                            <div>
                              <h3>Ready for the payment demo</h3>
                              <p>
                                Check your products and totals, then continue to
                                the Razorpay-style simulation.
                              </p>
                            </div>
                          </div>
                          <button
                            className="btn primary full"
                            onClick={() => setCheckoutStep(3)}
                          >
                            Continue to mock payment <ArrowRight size={17} />
                          </button>
                        </div>
                      ) : (
                        <div className="panel mock-payment">
                          <div className="mock-payment-head">
                            <div className="mock-mark">
                              <span>R</span>
                              <strong>Razorpay-style</strong>
                            </div>
                            <span className="demo-pill">DEMO ONLY</span>
                          </div>
                          <h2>Choose a mock payment method</h2>
                          <p>
                            No card number, UPI ID, bank detail or money is
                            requested or stored.
                          </p>
                          <div className="payment-methods">
                            {[
                              ["UPI", WalletCards, "Instant demo"],
                              ["Card", CreditCard, "No card details"],
                              ["Wallet", WalletCards, "Sample wallet"],
                            ].map(([name, Icon, detail]: any) => (
                              <button
                                key={name}
                                className={
                                  paymentMethod === name ? "selected" : ""
                                }
                                onClick={() => {
                                  setPaymentMethod(name);
                                  setPaymentSimulated(false);
                                }}
                              >
                                <Icon size={21} />
                                <span>
                                  <strong>{name}</strong>
                                  <small>{detail}</small>
                                </span>
                                {paymentMethod === name && (
                                  <CheckCircle2 size={18} />
                                )}
                              </button>
                            ))}
                          </div>
                          {!paymentSimulated ? (
                            <button
                              className="btn primary full"
                              onClick={() => setPaymentSimulated(true)}
                            >
                              Simulate {paymentMethod} payment{" "}
                              <Sparkles size={17} />
                            </button>
                          ) : (
                            <div className="simulation-success">
                              <CheckCircle2 />
                              <div>
                                <strong>Simulation successful</strong>
                                <small>No transaction occurred.</small>
                              </div>
                            </div>
                          )}
                          <button
                            className="btn primary full"
                            disabled={busy || !paymentSimulated}
                            onClick={async () => {
                              const r = await mutate({
                                action: "previewOrder",
                                address,
                                coupon,
                                voucher,
                                key: orderKey,
                                method: paymentMethod,
                                simulated: true,
                                deliverySpeed,
                                deliverySlot,
                                deliveryInstruction,
                              });
                              if (r?.order) setSavedOrder(r.order);
                            }}
                          >
                            {busy ? (
                              <LoaderCircle className="spin" size={18} />
                            ) : (
                              <CheckCircle2 size={18} />
                            )}
                            Save preview order
                          </button>
                          <button
                            className="text-link"
                            onClick={() => setCheckoutStep(2)}
                          >
                            <ArrowLeft size={15} />
                            Back to review
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <aside className="checkout-aside">
                  <div className="shipping-progress">
                    <span>
                      {sum.subtotal - sum.discount >= 2999
                        ? "Free preview delivery unlocked"
                        : money(
                            Math.max(0, 2999 - (sum.subtotal - sum.discount)),
                          ) + " away from free preview delivery"}
                    </span>
                    <Progress
                      value={Math.min(
                        100,
                        ((sum.subtotal - sum.discount) / 2999) * 100,
                      )}
                    />
                  </div>
                  {couponBox()}
                  {summary()}
                  {path === "/cart" && (
                    <button
                      className="btn primary full"
                      onClick={() =>
                        requireLogin("/checkout") && go("/checkout")
                      }
                    >
                      Continue to checkout <ArrowRight size={17} />
                    </button>
                  )}
                  <div className="aside-note">
                    <ShieldCheck size={17} />
                    <span>Private shopping preview. No real purchases.</span>
                  </div>
                  {link(
                    "/shop",
                    <>
                      Continue exploring <ArrowUpRight size={15} />
                    </>,
                    "text-link",
                  )}
                </aside>
              </div>
            ) : (
              emptyState(
                <ShoppingBag />,
                "Your next favourite is waiting.",
                "Start with a find that makes your everyday a little better.",
              )
            )}
          </>
        )}
        {path === "/account" && (
          <>
            {sectionTitle(
              "YOUR RYZE",
              "A space of your own.",
              data.user
                ? "Manage your details, saved finds and shopping preferences."
                : "Sign in to keep your favourites and shopping together.",
            )}
            {loading ? (
              <p className="loading-line">
                <LoaderCircle className="spin" />
                Loading your account…
              </p>
            ) : data.user ? (
              <>
                <div className="account-welcome">
                  <div className="avatar">
                    {(data.profile.name || data.user.name || data.user.email)
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2>
                      Hello, {data.profile.name || data.user.name || "there"}.
                    </h2>
                    <p>{data.user.email}</p>
                  </div>
                  {link(
                    "/orders",
                    <>
                      My orders <ArrowUpRight size={17} />
                    </>,
                    "btn outlined",
                  )}
                </div>
                <Tabs
                  value={accountTab}
                  onValueChange={setAccountTab}
                  className="account-tabs"
                >
                  <TabsList variant="line">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="addresses">Addresses</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="profile">
                    <form
                      className="panel form-stack max-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        mutate(
                          {
                            action: "profile",
                            name: f.get("name"),
                            phone: f.get("phone"),
                          },
                          "Profile saved",
                        );
                      }}
                      key={data.profile.name}
                    >
                      <h2>The basics</h2>
                      <label>
                        Full name
                        <input
                          name="name"
                          required
                          minLength={2}
                          maxLength={80}
                          defaultValue={data.profile.name || data.user.name}
                        />
                      </label>
                      <label>
                        Email
                        <input value={data.user.email} readOnly />
                      </label>
                      <label>
                        Phone (optional)
                        <input
                          name="phone"
                          type="tel"
                          maxLength={20}
                          defaultValue={data.profile.phone}
                        />
                      </label>
                      <button className="btn primary" disabled={busy}>
                        Save details <Check size={17} />
                      </button>
                      <a
                        className="text-link"
                        href="/signout-with-chatgpt?return_to=/"
                        target="_top"
                      >
                        Sign out
                      </a>
                    </form>
                  </TabsContent>
                  <TabsContent value="addresses">
                    <div className="address-grid">
                      {data.addresses.map((a) => (
                        <div className="panel" key={a.id}>
                          <MapPin />
                          <h3>{a.name}</h3>
                          <p>
                            {a.line}
                            <br />
                            {a.city}, {a.pin}
                          </p>
                          <button
                            className="text-link"
                            disabled={busy}
                            onClick={() =>
                              mutate(
                                { action: "deleteAddress", id: a.id },
                                "Address removed",
                              )
                            }
                          >
                            <Trash2 size={15} />
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        className="new-address"
                        onClick={() => {
                          setAddress(blankAddress);
                          setInfo("address");
                        }}
                      >
                        <Plus />
                        <span>Add an address</span>
                      </button>
                    </div>
                  </TabsContent>
                  <TabsContent value="preferences">
                    <section className="panel max-form">
                      <h2>Your preferences</h2>
                      <div className="setting-row">
                        <div>
                          <strong>Fresh finds & new collections</strong>
                          <p>Save your preference for launch updates.</p>
                        </div>
                        <Switch
                          aria-label="Newsletter preference"
                          checked={!!data.preferences.newsletter}
                          disabled={busy}
                          onCheckedChange={(v) =>
                            mutate(
                              {
                                action: "preferences",
                                ...data.preferences,
                                newsletter: v,
                              },
                              "Preference saved",
                            )
                          }
                        />
                      </div>
                      <div className="setting-row">
                        <div>
                          <strong>Product alerts</strong>
                          <p>
                            Save your preference for price and stock alerts.
                          </p>
                        </div>
                        <Switch
                          aria-label="Product alert preference"
                          checked={!!data.preferences.alerts}
                          disabled={busy}
                          onCheckedChange={(v) =>
                            mutate(
                              {
                                action: "preferences",
                                ...data.preferences,
                                alerts: v,
                              },
                              "Preference saved",
                            )
                          }
                        />
                      </div>
                      <p className="muted">
                        Email and push delivery are not connected. These
                        controls save preferences only.
                      </p>
                      <div className="setting-row">
                        <div>
                          <strong>Evening mode</strong>
                          <p>A darker view, saved on this device.</p>
                        </div>
                        <Switch
                          checked={dark}
                          aria-label="Evening mode"
                          onCheckedChange={changeTheme}
                        />
                      </div>
                      <button
                        className="btn outlined"
                        onClick={() =>
                          download(
                            "ryze-my-data.json",
                            JSON.stringify(data, null, 2),
                            "application/json",
                          )
                        }
                      >
                        <Download size={16} />
                        Export my saved data
                      </button>
                    </section>
                  </TabsContent>
                  <TabsContent value="activity">
                    <div className="stat-grid">
                      <div>
                        <Heart />
                        <strong>{data.wishlist.length}</strong>
                        <span>Saved favourites</span>
                      </div>
                      <div>
                        <Package />
                        <strong>{data.orders.length}</strong>
                        <span>Preview orders</span>
                      </div>
                      <div>
                        <Bell />
                        <strong>{data.alerts.length}</strong>
                        <span>Saved alerts</span>
                      </div>
                    </div>
                    {link(
                      "/wishlist",
                      <>
                        Visit your wishlist <ArrowUpRight size={16} />
                      </>,
                      "text-link",
                    )}
                    <section className="panel mt-6">
                      <h2>Support drafts</h2>
                      {data.tickets.length ? (
                        data.tickets.map((t) => (
                          <div className="ticket" key={t.id}>
                            <strong>
                              {t.number} · {t.subject}
                            </strong>
                            <p>{t.message}</p>
                            <small>{t.status}</small>
                          </div>
                        ))
                      ) : (
                        <p className="muted">No support drafts yet.</p>
                      )}
                    </section>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="empty-state">
                <UserRound />
                <h2>Everything, in your space.</h2>
                <p>
                  Sign in with ChatGPT to save your bag, addresses and preview
                  orders.
                </p>
                <a
                  className="btn primary"
                  href="/signin-with-chatgpt?return_to=/account"
                  target="_top"
                >
                  Sign in with ChatGPT <ArrowRight size={17} />
                </a>
              </div>
            )}
          </>
        )}
        {path === "/orders" && (
          <>
            {sectionTitle(
              "YOUR FINDS",
              "The order notebook.",
              "Preview orders are saved here. No payments or shipments are created.",
            )}
            {data.orders.length ? (
              <div className="orders-list">
                {data.orders.map((o) => (
                  <article className="order-card" key={o.id}>
                    <div className="order-top">
                      <div>
                        <small>
                          {new Date(o.created).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </small>
                        <h3>{o.number}</h3>
                      </div>
                      <span
                        className={
                          "status " +
                          (o.status === "Cancelled" ? "cancelled" : "")
                        }
                      >
                        {o.status === "Cancelled" ? (
                          <X size={14} />
                        ) : (
                          <Check size={14} />
                        )}{" "}
                        {o.status}
                      </span>
                      <strong>{money(o.total)}</strong>
                    </div>
                    <div className="order-items">
                      {o.items.map((l) => (
                        <div key={l.id}>
                          <img src={l.product.image} alt={l.product.name} />
                          <span>
                            {l.product.name}
                            <small>
                              {l.qty} × {money(l.product.price)}
                            </small>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="order-bottom">
                      <span>
                        <MapPin size={15} />
                        {o.address.city}, {o.address.pin}
                      </span>
                      <button
                        onClick={() =>
                          go("/track?order=" + encodeURIComponent(o.number))
                        }
                      >
                        <Navigation size={15} />
                        Track
                      </button>
                      <button onClick={() => receipt(o)}>
                        <Download size={15} />
                        Receipt
                      </button>
                      <button onClick={() => go("/order/" + o.id)}>
                        <ArrowUpRight size={15} /> Manage order
                      </button>
                      <button
                        disabled={busy}
                        onClick={async () => {
                          for (const item of o.items) {
                            const p = catalog.find((p) => p.id === item.id);
                            if (p) {
                              const r = await add(p, item.qty);
                              if (!r) return;
                            }
                          }
                          setCartOpen(true);
                        }}
                      >
                        <RotateCcw size={15} />
                        Add again
                      </button>
                      {o.status === "Preview saved" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            mutate(
                              { action: "cancelOrder", id: o.id },
                              "Preview order cancelled",
                            )
                          }
                        >
                          Cancel preview
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              emptyState(
                <Package />,
                "Your story starts with a find.",
                "Save a preview order at checkout to explore order history.",
              )
            )}
          </>
        )}
        {path.startsWith("/order/") && (
          <>
            {selectedOrder ? (
              <>
                {sectionTitle(
                  "ORDER " + selectedOrder.number,
                  "Everything about this order.",
                  "Manage each item, delivery preferences and support from one place.",
                )}
                <section className="order-detail-head">
                  <div>
                    <small>STATUS</small>
                    <h2>{selectedOrder.status}</h2>
                    <p>
                      Saved{" "}
                      {new Date(selectedOrder.created).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <strong>{money(selectedOrder.total)}</strong>
                </section>
                <div
                  className="delivery-timeline"
                  aria-label="Delivery timeline"
                >
                  {[
                    "Preview saved",
                    "Processing",
                    "Out for delivery",
                    "Delivered",
                  ].map((step, i) => (
                    <div className={i === 0 ? "active" : ""} key={step}>
                      <span>{i + 1}</span>
                      <strong>{step}</strong>
                      <small>
                        {i ? "Awaiting live fulfilment" : "Complete"}
                      </small>
                    </div>
                  ))}
                </div>
                <div className="order-detail-grid">
                  <section className="panel">
                    <h2>Items</h2>
                    {selectedOrder.items.map((item) => (
                      <article className="order-line" key={item.id}>
                        <img src={item.product.image} alt={item.product.name} />
                        <div>
                          <h3>{item.product.name}</h3>
                          <p>
                            {item.qty} × {money(item.product.price)}
                          </p>
                          <small>{item.itemStatus || "Preview saved"}</small>
                        </div>
                        <div className="order-line-actions">
                          <button
                            disabled={busy || item.itemStatus === "Cancelled"}
                            onClick={() =>
                              mutate(
                                {
                                  action: "orderAction",
                                  op: "cancelItem",
                                  id: selectedOrder.id,
                                  productId: item.id,
                                },
                                "Item cancelled",
                              )
                            }
                          >
                            Cancel item
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              mutate(
                                {
                                  action: "orderAction",
                                  op: "request",
                                  requestType: "Return",
                                  id: selectedOrder.id,
                                  productId: item.id,
                                },
                                "Return request saved",
                              )
                            }
                          >
                            Return
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              mutate(
                                {
                                  action: "orderAction",
                                  op: "request",
                                  requestType: "Replacement",
                                  id: selectedOrder.id,
                                  productId: item.id,
                                },
                                "Replacement request saved",
                              )
                            }
                          >
                            Replace
                          </button>
                        </div>
                      </article>
                    ))}
                  </section>
                  <aside className="panel form-stack">
                    <h2>Delivery & support</h2>
                    <p>
                      <MapPin size={16} />
                      {selectedOrder.address.line}
                      <br />
                      {selectedOrder.address.city}, {selectedOrder.address.pin}
                    </p>
                    <p>
                      <Truck size={16} />
                      {selectedOrder.deliverySpeed || "Standard"} ·{" "}
                      {selectedOrder.deliverySlot || "Any time"}
                    </p>
                    <label>
                      Delivery instructions
                      <textarea
                        rows={3}
                        maxLength={240}
                        defaultValue={selectedOrder.deliveryInstruction}
                        onBlur={(e) =>
                          mutate(
                            {
                              action: "orderAction",
                              op: "instruction",
                              id: selectedOrder.id,
                              instruction: e.target.value,
                            },
                            "Delivery instruction saved",
                          )
                        }
                      />
                    </label>
                    <button
                      className="btn outlined"
                      onClick={() =>
                        go(
                          "/track?order=" +
                            encodeURIComponent(selectedOrder.number),
                        )
                      }
                    >
                      <Navigation size={16} /> Track order
                    </button>
                    <button
                      className="btn outlined"
                      onClick={() => receipt(selectedOrder)}
                    >
                      <Download size={16} /> Download invoice
                    </button>
                    <button
                      className="btn outlined"
                      onClick={async () => {
                        for (const item of selectedOrder.items) {
                          const p = catalog.find((p) => p.id === item.id);
                          if (p && !(await add(p, item.qty))) return;
                        }
                        setCartOpen(true);
                      }}
                    >
                      <RotateCcw size={16} /> Buy again
                    </button>
                    <button
                      className="btn outlined"
                      onClick={() => go("/help")}
                    >
                      <MessageCircle size={16} /> Contact support
                    </button>
                    <p className="muted">
                      Returns and replacements are saved as preview requests; no
                      carrier or supplier is contacted.
                    </p>
                  </aside>
                </div>
              </>
            ) : (
              emptyState(
                <Package />,
                "Order not found.",
                "Return to your order notebook and choose a saved preview order.",
              )
            )}
          </>
        )}
        {path === "/help" && (
          <>
            {sectionTitle(
              "HERE TO HELP",
              "A little clarity.",
              "Everything you need to know about this RYZE preview.",
            )}
            <div className="help-layout">
              <section className="faq">
                {faq.map(([q, a]) => (
                  <details key={q}>
                    <summary>
                      {q}
                      <Plus size={17} />
                    </summary>
                    <p>{a}</p>
                  </details>
                ))}
              </section>
              <form
                className="panel form-stack"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const f = new FormData(form);
                  const r = await mutate(
                    {
                      action: "ticket",
                      subject: f.get("subject"),
                      message: f.get("message"),
                    },
                    "Support draft saved to your account",
                  );
                  if (r) form.reset();
                }}
              >
                <MessageCircle />
                <h2>Leave a note.</h2>
                <p className="muted">
                  Save a support draft to your account. It won’t be sent to
                  anyone.
                </p>
                <label>
                  Subject
                  <input
                    name="subject"
                    required
                    maxLength={100}
                    placeholder="What can we help with?"
                  />
                </label>
                <label>
                  Your message
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    maxLength={3000}
                    rows={5}
                    placeholder="Tell us a little more…"
                  />
                </label>
                <button className="btn primary" disabled={busy}>
                  Save support draft <ArrowRight size={17} />
                </button>
              </form>
            </div>
          </>
        )}
        {path === "/studio" && (
          <>
            {sectionTitle(
              "RYZE / STORE STUDIO",
              "Behind the good finds.",
              "Your private catalogue workspace. Edits affect your signed-in preview only.",
            )}
            {!data.user && !loading ? (
              <div className="empty-state">
                <LockKeyhole />
                <h2>Sign in to your studio.</h2>
                <a
                  className="btn primary"
                  href="/signin-with-chatgpt?return_to=/studio"
                  target="_top"
                >
                  Sign in with ChatGPT
                </a>
              </div>
            ) : (
              <>
                <div className="stat-grid">
                  <div>
                    <Package />
                    <strong>{catalog.length}</strong>
                    <span>Concept products</span>
                  </div>
                  <div>
                    <ShoppingBag />
                    <strong>{data.orders.length}</strong>
                    <span>Preview orders</span>
                  </div>
                  <div>
                    <Scale />
                    <strong>
                      {money(
                        data.orders
                          .filter((o) => o.status !== "Cancelled")
                          .reduce((s, o) => s + o.total, 0),
                      )}
                    </strong>
                    <span>Preview order value · not revenue</span>
                  </div>
                </div>
                <Tabs defaultValue="catalog" className="studio-tabs">
                  <TabsList variant="line">
                    <TabsTrigger value="catalog">Catalogue</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="connections">Connections</TabsTrigger>
                    <TabsTrigger value="features">Feature map</TabsTrigger>
                  </TabsList>
                  <TabsContent value="catalog">
                    <div className="panel">
                      <div className="section-head">
                        <h2>Your collection</h2>
                        <button
                          className="text-link"
                          onClick={() => {
                            const escape = (s: any) =>
                              '"' + String(s).replaceAll('"', '""') + '"';
                            download(
                              "ryze-catalogue.csv",
                              [
                                "ID,Name,Category,Price INR,Preview stock",
                                ...catalog.map((p) =>
                                  [p.id, p.name, p.category, p.price, p.stock]
                                    .map(escape)
                                    .join(","),
                                ),
                              ].join("\n"),
                              "text/csv",
                            );
                          }}
                        >
                          <Download size={16} />
                          Export CSV
                        </button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Preview stock</TableHead>
                            <TableHead>Edit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {catalog.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>
                                <div className="table-product">
                                  <img src={p.image} alt="" />
                                  <span>{p.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{p.category}</TableCell>
                              <TableCell>{money(p.price)}</TableCell>
                              <TableCell>
                                <span
                                  className={
                                    p.stock ? "status" : "status cancelled"
                                  }
                                >
                                  {p.stock}
                                </span>
                              </TableCell>
                              <TableCell>
                                <button
                                  aria-label={"Edit " + p.name}
                                  className="icon-btn"
                                  onClick={() => setEditingProduct(p)}
                                >
                                  <Settings2 size={17} />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="orders">
                    <div className="panel">
                      <h2>Preview order overview</h2>
                      {data.orders.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Payment</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.orders.map((o) => (
                              <TableRow key={o.id}>
                                <TableCell>{o.number}</TableCell>
                                <TableCell>{o.status}</TableCell>
                                <TableCell>{money(o.total)}</TableCell>
                                <TableCell>Not collected</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="muted">
                          No preview orders yet. Explore checkout to create one.
                        </p>
                      )}
                      {link(
                        "/orders",
                        <>
                          Open order notebook <ArrowUpRight size={16} />
                        </>,
                        "text-link",
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="connections">
                    <div className="connection-grid">
                      {[
                        {
                          title: "Payments",
                          desc: "Connect a merchant payment provider, verify payment events, and configure refunds before accepting money.",
                        },
                        {
                          title: "Suppliers & inventory",
                          desc: "Add real products, supplier specifications and stock feeds. Connect supplier order routing.",
                        },
                        {
                          title: "Delivery & returns",
                          desc: "Configure shipping rates, serviceable locations, tracking updates and return policies.",
                        },
                        {
                          title: "Customer sign-in",
                          desc: "This private preview uses ChatGPT sign-in. A public customer authentication service is not connected.",
                        },
                        {
                          title: "Email & notifications",
                          desc: "Preferences and drafts are saved. A delivery provider is needed to send receipts, support messages or alerts.",
                        },
                        {
                          title: "AI & analytics",
                          desc: "The guided finder uses category and budget matching. AI models and analytics providers are not connected.",
                        },
                      ].map((c) => (
                        <article className="panel" key={c.title}>
                          <span className="status neutral">Not connected</span>
                          <h2>{c.title}</h2>
                          <p>{c.desc}</p>
                        </article>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="features">
                    <div className="feature-map">
                      {featureGroups.map((g) => (
                        <div className="panel" key={g.name}>
                          <h2>{g.name}</h2>
                          <div>
                            <span className="status">
                              Available in this preview
                            </span>
                            <p>{g.live}</p>
                          </div>
                          <div>
                            <span className="status neutral">
                              Further implementation required
                            </span>
                            <p>{g.next}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </main>
      <footer>
        <div className="footer-top">
          <div>
            {link(
              "/",
              <>
                RYZE<span>STORES</span>
              </>,
              "brand",
            )}
            <p>Rise above the ordinary.</p>
            <small>Considered finds for a life well lived.</small>
          </div>
          <div>
            <h3>Explore</h3>
            {link("/shop", "All finds")}
            {link("/collections", "The edit")}
            {link("/offers", "Coupons & vouchers")}
            {link("/compare", "Compare products")}
          </div>
          <div>
            <h3>Your space</h3>
            {link("/account", "My account")}
            {link("/orders", "My orders")}
            {link("/track", "Track my order")}
            {link("/wishlist", "Saved favourites")}
          </div>
          <div>
            <h3>A little help</h3>
            {link("/help", "Help centre")}
            <button onClick={() => setInfo("delivery")}>
              Delivery & returns
            </button>
            {link("/studio", "Store studio")}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} RYZE STORES</span>
          <span>Concept catalogue · No real purchases</span>
          <button onClick={changeTheme}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}{" "}
            {dark ? "Day mode" : "Evening mode"}
          </button>
          <button onClick={() => setInfo("privacy")}>Privacy</button>
        </div>
      </footer>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {link(
          "/",
          <>
            <span>
              <Home />{" "}
            </span>
            <strong>Home</strong>
          </>,
          path === "/" ? "active" : "",
        )}
        {link(
          "/cart",
          <>
            <span>
              <ShoppingBag />
              {cartCount > 0 && <i>{cartCount}</i>}
            </span>
            <strong>Cart</strong>
          </>,
          path === "/cart" || path === "/checkout" ? "active" : "",
        )}
        {link(
          "/account",
          <>
            <span>
              <UserRound />
            </span>
            <strong>Profile</strong>
          </>,
          path === "/account" ? "active" : "",
        )}
        {link(
          "/shop",
          <>
            <span>
              <Compass />
            </span>
            <strong>Browse</strong>
          </>,
          path === "/shop" || path === "/search" ? "active" : "",
        )}
      </nav>
      {data.compare.length > 0 && path !== "/compare" && (
        <div className="compare-tray">
          <Scale size={17} />
          <span>{data.compare.length} selected</span>
          <button onClick={() => go("/compare")}>
            Compare <ArrowRight size={15} />
          </button>
        </div>
      )}
      <button
        className="finder-fab"
        aria-label="Open product finder"
        onClick={() => setFinder(true)}
      >
        <Sparkles size={20} />
        <span>Find my fit</span>
      </button>
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="bag-sheet">
          <SheetHeader>
            <SheetTitle>
              Your shopping bag <span className="count">{cartCount}</span>
            </SheetTitle>
            <SheetDescription>Good finds, all together.</SheetDescription>
          </SheetHeader>
          {loading ? (
            <p className="p-6">Loading saved bag…</p>
          ) : data.cart.length ? (
            <>
              <div className="sheet-scroll">
                {bagLines()}
                <div className="shipping-progress">
                  <span>
                    {sum.subtotal - sum.discount >= 2999
                      ? "Free preview delivery unlocked"
                      : money(Math.max(0, 2999 - sum.subtotal + sum.discount)) +
                        " to free preview delivery"}
                  </span>
                  <Progress
                    value={Math.min(
                      100,
                      ((sum.subtotal - sum.discount) / 2999) * 100,
                    )}
                  />
                </div>
              </div>
              <div className="sheet-checkout">
                <div>
                  <span>Estimated total</span>
                  <strong>{money(sum.total)}</strong>
                </div>
                <button
                  className="btn primary full"
                  onClick={() => requireLogin("/checkout") && go("/checkout")}
                >
                  Preview checkout <ArrowRight size={17} />
                </button>
                <button className="text-link" onClick={() => go("/cart")}>
                  View bag & apply a code
                </button>
                <small>No payment is taken in this preview.</small>
              </div>
            </>
          ) : (
            emptyState(
              <ShoppingBag />,
              "A bag full of possibilities.",
              "Your favourites are just a few clicks away.",
            )
          )}
        </SheetContent>
      </Sheet>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Discover RYZE</SheetTitle>
            <SheetDescription>
              Your next favourite starts here.
            </SheetDescription>
          </SheetHeader>
          <div className="mobile-links">
            {[
              ["Search", "/search"],
              ["Discover", "/shop"],
              ["Audio", "/shop?category=Audio"],
              ["Workspace", "/shop?category=Workspace"],
              ["Living", "/shop?category=Living"],
              ["Wearables", "/shop?category=Wearables"],
              ["The edit", "/collections"],
              ["Offers & vouchers", "/offers"],
              ["Track my order", "/track"],
              ["My account", "/account"],
              ["My orders", "/orders"],
              ["Store studio", "/studio"],
            ].map(([label, href]) => (
              <button key={label} onClick={() => go(href)}>
                {label}
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Find your fit</SheetTitle>
            <SheetDescription>A few small refinements.</SheetDescription>
          </SheetHeader>
          <div className="filter-content">
            <h3>Price range</h3>
            <p>Up to {money(budget)}</p>
            <Slider
              aria-label="Maximum price"
              min={500}
              max={6000}
              step={100}
              value={[budget]}
              onValueChange={(v) => setBudget(v[0])}
            />
            <div className="setting-row">
              <label htmlFor="stock-filter">Available in preview</label>
              <Checkbox
                id="stock-filter"
                checked={inStock}
                onCheckedChange={(v) => setInStock(v === true)}
              />
            </div>
            <button
              className="btn primary full"
              onClick={() => setFiltersOpen(false)}
            >
              Show {filtered.length} finds
            </button>
            <button
              className="text-link"
              onClick={() => {
                setBudget(6000);
                setInStock(false);
              }}
            >
              Reset filters
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="search-dialog">
          <DialogHeader>
            <DialogTitle>Find something good.</DialogTitle>
            <DialogDescription>
              Search the concept collection.
            </DialogDescription>
          </DialogHeader>
          <form
            className="shop-search"
            onSubmit={(e) => {
              e.preventDefault();
              go("/shop?q=" + encodeURIComponent(query));
            }}
          >
            <Search size={20} />
            <input
              autoFocus
              placeholder="Headphones, a desk upgrade…"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button aria-label="Search">
              <ArrowRight size={20} />
            </button>
          </form>
          <div className="search-results">
            {catalog
              .filter((p) =>
                (p.name + " " + p.category)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .slice(0, 5)
              .map((p) => (
                <button key={p.id} onClick={() => go("/product/" + p.id)}>
                  <img src={p.image} alt="" />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.category}</small>
                  </span>
                  <b>{money(p.price)}</b>
                  <ArrowUpRight size={16} />
                </button>
              ))}
          </div>
          {query &&
            !catalog.some((p) =>
              (p.name + " " + p.category)
                .toLowerCase()
                .includes(query.toLowerCase()),
            ) && (
              <p className="muted">
                No exact matches. Try “audio”, “keyboard” or “lamp”.
              </p>
            )}
          <div className="search-categories">
            {categories.slice(1).map((c) => (
              <button key={c} onClick={() => go("/shop?category=" + c)}>
                {c}
                <ArrowUpRight size={12} />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!quick} onOpenChange={(v) => !v && setQuick(null)}>
        <DialogContent className="quick-dialog">
          {quick && (
            <>
              <div className="quick-image">
                <img src={quick.image} alt={quick.name} />
              </div>
              <div className="quick-copy">
                <DialogHeader>
                  <div className="eyebrow">{quick.category}</div>
                  <DialogTitle>{quick.name}</DialogTitle>
                  <DialogDescription>{quick.description}</DialogDescription>
                </DialogHeader>
                <h3>
                  {money(
                    catalog.find((p) => p.id === quick.id)?.price ||
                      quick.price,
                  )}
                </h3>
                <small>Concept product · Sample price</small>
                <button
                  className="btn primary full"
                  disabled={busy || quick.stock === 0}
                  onClick={async () => {
                    const r = await add(quick);
                    if (r) {
                      setQuick(null);
                      setCartOpen(true);
                    }
                  }}
                >
                  Add to bag <Plus size={17} />
                </button>
                <button
                  className="text-link"
                  onClick={() => go("/product/" + quick.id)}
                >
                  Explore the details <ArrowUpRight size={17} />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!zoom} onOpenChange={(v) => !v && setZoom(null)}>
        <DialogContent className="zoom-dialog">
          <DialogHeader>
            <DialogTitle>{zoom?.name}</DialogTitle>
            <DialogDescription>Original concept image</DialogDescription>
          </DialogHeader>
          {zoom && <img src={zoom.image} alt={zoom.name} />}
        </DialogContent>
      </Dialog>
      <Dialog open={finder} onOpenChange={setFinder}>
        <DialogContent className="finder-dialog">
          <DialogHeader>
            <span className="finder-icon">
              <Sparkles />
            </span>
            <div className="eyebrow">THE RYZE FINDER</div>
            <DialogTitle>What’s your next upgrade?</DialogTitle>
            <DialogDescription>
              A guided match using your category and budget.
            </DialogDescription>
          </DialogHeader>
          <div className="form-stack">
            <label>What are you in the mood for?</label>
            <Select value={finderCategory} onValueChange={setFinderCategory}>
              <SelectTrigger className="full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem value={c} key={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label>Your budget</label>
            <Select value={finderBudget} onValueChange={setFinderBudget}>
              <SelectTrigger className="full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2000, 3000, 4000, 6000].map((v) => (
                  <SelectItem value={String(v)} key={v}>
                    Up to {money(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="finder-matches">
              {catalog
                .filter(
                  (p) =>
                    (finderCategory === "All finds" ||
                      p.category === finderCategory) &&
                    p.price <= Number(finderBudget),
                )
                .slice(0, 2)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setFinder(false);
                      go("/product/" + p.id);
                    }}
                  >
                    <img src={p.image} alt={p.name} />
                    <span>
                      {p.name}
                      <strong>{money(p.price)}</strong>
                    </span>
                    <ArrowUpRight size={18} />
                  </button>
                ))}
              {!catalog.some(
                (p) =>
                  (finderCategory === "All finds" ||
                    p.category === finderCategory) &&
                  p.price <= Number(finderBudget),
              ) && <p>No matches at this budget yet. Try another category.</p>}
            </div>
            <button
              className="btn primary full"
              onClick={() => {
                setBudget(Number(finderBudget));
                setFinder(false);
                go("/shop?category=" + encodeURIComponent(finderCategory));
              }}
            >
              Explore my matches <ArrowRight size={17} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!info} onOpenChange={(v) => !v && setInfo("")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {info.startsWith("signin")
                ? "Make room for your favourites."
                : info === "location"
                  ? "Choose your delivery location."
                  : info === "address"
                    ? "A new address."
                    : info === "privacy"
                      ? "Your private shopping space."
                      : info.startsWith("share:")
                        ? "Share this find."
                        : "Delivery & returns"}
            </DialogTitle>
            <DialogDescription>
              {info.startsWith("signin")
                ? "Sign in to save your shopping across visits."
                : info === "location"
                  ? "Save a city and PIN code for a more personal home screen."
                  : info === "address"
                    ? "Save a delivery address to your account."
                    : info === "privacy"
                      ? "What this preview stores."
                      : info.startsWith("share:")
                        ? "Copy the link below."
                        : "Clear expectations for this preview."}
            </DialogDescription>
          </DialogHeader>
          {info.startsWith("signin") ? (
            <a
              className="btn primary"
              href={
                "/signin-with-chatgpt?return_to=" +
                encodeURIComponent(
                  info.startsWith("signin:") ? info.slice(7) : path,
                )
              }
              target="_top"
            >
              Sign in with ChatGPT <ArrowRight size={16} />
            </a>
          ) : info === "location" ? (
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!requireLogin("/")) return;
                const r = await mutate(
                  { action: "location", city: locationCity, pin: locationPin },
                  "Delivery location saved",
                );
                if (r) setInfo("");
              }}
            >
              <label>
                City
                <input
                  required
                  maxLength={80}
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="Kannur"
                />
              </label>
              <label>
                PIN code
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={locationPin}
                  onChange={(e) => setLocationPin(e.target.value)}
                  placeholder="670001"
                />
              </label>
              <p className="muted small">
                This does not check real delivery serviceability.
              </p>
              <button className="btn primary" disabled={busy}>
                Save location <Navigation size={16} />
              </button>
            </form>
          ) : info === "address" ? (
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await mutate(
                  { action: "address", address },
                  "Address saved",
                );
                if (r) setInfo("");
              }}
            >
              {addressFields(address, setAddress)}
              <button className="btn primary" disabled={busy}>
                Save address
              </button>
            </form>
          ) : info === "privacy" ? (
            <div className="prose">
              <p>
                This private preview saves your profile, addresses, shopping
                selections, preferences, support drafts and preview orders
                against your signed-in identity.
              </p>
              <p>
                It does not collect card details or send marketing messages.
                Concept imagery and prices are used throughout.
              </p>
              <p>
                You can export your saved data in Account → Preferences.
                Public-store privacy terms and account deletion workflows have
                not been implemented.
              </p>
            </div>
          ) : info.startsWith("share:") ? (
            <input
              readOnly
              aria-label="Share URL"
              value={info.slice(6)}
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <div className="prose">
              <p>
                No products are dispatched from this private preview. The
                delivery calculator uses an illustrative ₹99 fee, free from
                ₹2,999 after discounts.
              </p>
              <p>
                Real shipping rates, serviceability, taxes, returns and warranty
                policies must be configured before launch.
              </p>
              {link("/help", "Read the preview FAQs", "text-link")}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editingProduct}
        onOpenChange={(v) => !v && setEditingProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit your concept product</DialogTitle>
            <DialogDescription>
              Changes apply to your own preview catalogue.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const r = await mutate(
                  {
                    action: "catalog",
                    id: editingProduct.id,
                    name: f.get("name"),
                    price: Number(f.get("price")),
                    stock: Number(f.get("stock")),
                  },
                  "Catalogue updated",
                );
                if (r) setEditingProduct(null);
              }}
            >
              <label>
                Product name
                <input
                  name="name"
                  defaultValue={editingProduct.name}
                  required
                  minLength={3}
                  maxLength={100}
                />
              </label>
              <label>
                Price in INR
                <input
                  name="price"
                  type="number"
                  min={1}
                  max={1000000}
                  step={1}
                  required
                  defaultValue={editingProduct.price}
                />
              </label>
              <label>
                Preview stock
                <input
                  name="stock"
                  type="number"
                  min={0}
                  max={10000}
                  step={1}
                  required
                  defaultValue={editingProduct.stock}
                />
              </label>
              <button className="btn primary" disabled={busy}>
                Save product <Check size={17} />
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!reviewProduct}
        onOpenChange={(v) => !v && setReviewProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your take on {reviewProduct?.name}</DialogTitle>
            <DialogDescription>
              Private preview feedback; not a verified-purchase review.
            </DialogDescription>
          </DialogHeader>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const r = await mutate(
                {
                  action: "review",
                  id: reviewProduct?.id,
                  rating,
                  message: f.get("message"),
                },
                "Preview review saved",
              );
              if (r) setReviewProduct(null);
            }}
          >
            <label>Rating</label>
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  aria-label={n + " stars"}
                  key={n}
                  onClick={() => setRating(n)}
                >
                  <Star fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <label>
              Your thoughts
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={1500}
                rows={4}
              />
            </label>
            <button className="btn primary" disabled={busy}>
              Save preview review
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function addressFields(a: Address, set: (a: Address) => void) {
  return (
    <>
      <label>
        Full name
        <input
          required
          value={a.name}
          maxLength={80}
          autoComplete="name"
          onChange={(e) => set({ ...a, name: e.target.value })}
        />
      </label>
      <label>
        Street address
        <input
          required
          value={a.line}
          maxLength={250}
          autoComplete="street-address"
          onChange={(e) => set({ ...a, line: e.target.value })}
        />
      </label>
      <div className="form-row">
        <label>
          City
          <input
            required
            value={a.city}
            maxLength={80}
            autoComplete="address-level2"
            onChange={(e) => set({ ...a, city: e.target.value })}
          />
        </label>
        <label>
          PIN code
          <input
            required
            value={a.pin}
            pattern="[0-9]{6}"
            maxLength={6}
            inputMode="numeric"
            autoComplete="postal-code"
            onChange={(e) => set({ ...a, pin: e.target.value })}
          />
        </label>
      </div>
    </>
  );
}
