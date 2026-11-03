import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDownRight, ArrowUpDown, ArrowUpRight, BarChart3, Check, ChevronRight, CircleCheck,
  CircleHelp, DollarSign, Eye, Filter, Languages, LayoutDashboard, Menu, Minus, MoreHorizontal,
  Package, Pencil, Plus, RotateCcw, Search, SearchX, Settings, ShoppingCart, Trash2, TrendingUp,
  Users, X, type LucideIcon,
} from 'lucide-react';
import { CategoryChart, MiniBars, RevenueChart } from './components/Charts';
import { initialData } from './data';
import { copy, getCategoryLabel, getPageLabel, type Language } from './i18n';
import type { Category, Customer, DemoData, Page, Product, Sale, SaleLine, StockFilter } from './types';

const pageIcons = {
  dashboard: LayoutDashboard,
  inventory: Package,
  sales: ShoppingCart,
  customers: Users,
  reports: BarChart3,
  settings: Settings,
} satisfies Record<Page, typeof LayoutDashboard>;

const pages: Page[] = ['dashboard', 'inventory', 'sales', 'customers', 'reports', 'settings'];
const categories: Category[] = ['Electronics', 'Home & Living', 'Office', 'Accessories', 'Appliances'];
const chartColors = ['#655be8', '#42a9a0', '#eea34f', '#7297d7', '#cf78a5'];

function pageFromPath(path: string): { page: Page; language: Language } {
  const language = path.startsWith('/es/') || path === '/es' ? 'es' : 'en';
  const section = path.replace(/^\/(?:es|en)\/?/, '').replace(/^\/|\/$/g, '') || 'dashboard';
  return { page: pages.includes(section as Page) ? section as Page : 'dashboard', language };
}

function pagePath(page: Page, language: Language) {
  return `/${language}/${page}`;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function currency(value: number, code: string, language: Language) {
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 2,
  }).format(value);
}

function shortDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function dateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function isLowStock(product: Product) {
  return product.stock <= product.minStock;
}

function EmptyState({ title, description, icon: Icon = SearchX }: { title: string; description: string; icon?: LucideIcon }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={18} /></span><strong>{title}</strong><p>{description}</p></div>;
}

function Modal({ title, description, children, footer, onClose, wide = false }: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const firstFocusable = dialog?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]');
    firstFocusable?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal${wide ? ' modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
          <button type="button" className="icon-close" onClick={onClose} aria-label="Close dialog"><X size={16} /></button>
        </header>
        {children}
        {footer && <footer className="modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

interface ToastMessage { id: number; text: string }
interface SaleDraftLine { productId: string; quantity: string }

export default function App({ initialPath = '/' }: { initialPath?: string }) {
  const initialRoute = pageFromPath(initialPath);
  const [page, setPage] = useState<Page>(initialRoute.page);
  const [language, setLanguage] = useState<Language>(initialRoute.language);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [data, setData] = useState<DemoData>(() => structuredClone(initialData));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortKey, setSortKey] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [customerSearch, setCustomerSearch] = useState('');
  const [salesSearch, setSalesSearch] = useState('');
  const [salesCustomerFilter, setSalesCustomerFilter] = useState('');
  const [reportPeriod, setReportPeriod] = useState('all');
  const [reportCategory, setReportCategory] = useState('all');
  const [productModal, setProductModal] = useState<Product | null | undefined>(undefined);
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [customerModal, setCustomerModal] = useState<Customer | null | undefined>(undefined);
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleCustomer, setSaleCustomer] = useState('');
  const [saleLines, setSaleLines] = useState<SaleDraftLine[]>([{ productId: '', quantity: '1' }]);
  const [confirmation, setConfirmation] = useState<{ title: string; description: string; action: () => void; danger?: boolean } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const t = copy[language];
  const money = (value: number) => currency(value, currencyCode, language);
  const dateLabel = (value: string) => shortDate(value, language);

  useEffect(() => {
    const syncRoute = () => {
      const route = pageFromPath(window.location.pathname);
      setPage(route.page);
      setLanguage(route.language);
      setSidebarOpen(false);
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const notify = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, text }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  };

  const navigate = (nextPage: Page, nextLanguage = language) => {
    const path = pagePath(nextPage, nextLanguage);
    if (window.location.pathname !== path) window.history.pushState({ path }, '', path);
    setPage(nextPage);
    setLanguage(nextLanguage);
    setSidebarOpen(false);
  };

  const changeLanguage = (next: Language) => {
    navigate(page, next);
    notify(next === 'es' ? copy.es.languageChanged : copy.en.languageChanged);
  };

  const handleGlobalSearch = (value: string) => {
    setGlobalSearch(value);
    if (value && page !== 'inventory') {
      setInventorySearch(value);
      navigate('inventory');
    } else if (page === 'inventory') {
      setInventorySearch(value);
    }
  };

  const totalRevenue = data.sales.reduce((sum, sale) => sum + sale.total, 0);
  const lowStockCount = data.products.filter(isLowStock).length;
  const inventoryValue = data.products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const latestSales = useMemo(() => [...data.sales].sort((a, b) => b.date.localeCompare(a.date)), [data.sales]);
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekSales = data.sales.filter((sale) => new Date(sale.date) >= weekStart);
  const priorWeekStart = new Date(weekStart);
  priorWeekStart.setDate(priorWeekStart.getDate() - 7);
  const priorWeekSales = data.sales.filter((sale) => new Date(sale.date) >= priorWeekStart && new Date(sale.date) < weekStart);
  const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.total, 0);
  const priorWeekRevenue = priorWeekSales.reduce((sum, sale) => sum + sale.total, 0);
  const revenueChange = priorWeekRevenue ? Math.round(((weekRevenue - priorWeekRevenue) / priorWeekRevenue) * 100) : null;

  const dashboardDaily = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const amount = data.sales
      .filter((sale) => new Date(sale.date) >= day && new Date(sale.date) < nextDay)
      .reduce((sum, sale) => sum + sale.total, 0);
    return { amount, day };
  });
  const dayLabels = dashboardDaily.map(({ day }) => t.dayNames[(day.getDay() + 6) % 7]);
  const categoryDistribution = categories.map((category) => ({
    label: getCategoryLabel(t, category),
    value: data.products.filter((product) => product.category === category).reduce((sum, product) => sum + product.stock, 0),
  }));

  const filteredProducts = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    const filtered = data.products.filter((product) => {
      const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
      const matchesCategory = inventoryCategory === 'all' || product.category === inventoryCategory;
      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'in-stock' && product.stock > product.minStock)
        || (stockFilter === 'low-stock' && product.stock > 0 && isLowStock(product))
        || (stockFilter === 'out-of-stock' && product.stock === 0);
      return matchesQuery && matchesCategory && matchesStock;
    });
    return filtered.sort((a, b) => {
      const first = a[sortKey];
      const second = b[sortKey];
      const result = typeof first === 'number' && typeof second === 'number'
        ? first - second
        : String(first).localeCompare(String(second));
      return sortDirection === 'asc' ? result : -result;
    });
  }, [data.products, inventoryCategory, inventorySearch, sortDirection, sortKey, stockFilter]);

  const filteredCustomers = data.customers.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();
    const matchesText = !query || [customer.name, customer.email, customer.company].some((value) => value.toLowerCase().includes(query));
    return matchesText;
  });
  const filteredSales = latestSales.filter((sale) => {
    const query = salesSearch.trim().toLowerCase();
    const matchesText = !query || sale.id.toLowerCase().includes(query) || sale.customerName.toLowerCase().includes(query);
    return matchesText && (!salesCustomerFilter || sale.customerId === salesCustomerFilter);
  });

  const toggleSort = (key: keyof Product) => {
    if (sortKey === key) setSortDirection((value) => value === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDirection('asc'); }
  };

  const saveProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const sku = String(form.get('sku') ?? '').trim().toUpperCase();
    const category = String(form.get('category') ?? '') as Category;
    const price = Number(form.get('price'));
    const stock = Number(form.get('stock'));
    const minStock = Number(form.get('minStock'));
    const duplicate = data.products.some((product) => product.sku.toLowerCase() === sku.toLowerCase() && product.id !== productModal?.id);
    if (!name || !sku || !categories.includes(category) || !Number.isFinite(price) || price < 0
      || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(minStock) || minStock < 0 || duplicate) return;
    const product: Product = {
      id: productModal?.id ?? makeId('p'),
      name, sku, category, price: Math.round(price * 100) / 100, stock, minStock,
    };
    setData((current) => ({
      ...current,
      products: productModal
        ? current.products.map((item) => item.id === product.id ? product : item)
        : [product, ...current.products],
    }));
    setProductModal(undefined);
    notify(copy[language].productSaved);
  };

  const requestDeleteProduct = (product: Product) => {
    setConfirmation({
      title: t.delete,
      description: `${t.deleteConfirm} ${product.name}`,
      danger: true,
      action: () => {
        setData((current) => ({ ...current, products: current.products.filter((item) => item.id !== product.id) }));
        setConfirmation(null);
        setProductDetails(null);
        notify(t.productDeleted);
      },
    });
  };

  const saveCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const phone = String(form.get('phone') ?? '').trim();
    const company = String(form.get('company') ?? '').trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !company) return;
    const customer: Customer = {
      id: customerModal?.id ?? makeId('c'), name, email, phone, company,
      registeredAt: customerModal?.registeredAt ?? new Date().toISOString().slice(0, 10),
    };
    setData((current) => ({
      ...current,
      customers: customerModal
        ? current.customers.map((item) => item.id === customer.id ? customer : item)
        : [customer, ...current.customers],
    }));
    setCustomerModal(undefined);
    notify(t.customerSaved);
  };

  const requestDeleteCustomer = (customer: Customer) => {
    setConfirmation({
      title: t.delete,
      description: `${t.deleteConfirm} ${customer.name}`,
      danger: true,
      action: () => {
        setData((current) => ({ ...current, customers: current.customers.filter((item) => item.id !== customer.id) }));
        setConfirmation(null);
        setCustomerDetails(null);
        notify(t.customerDeleted);
      },
    });
  };

  const openNewSale = () => {
    setSaleCustomer('');
    setSaleLines([{ productId: '', quantity: '1' }]);
    setSaleModalOpen(true);
  };

  const saleSubtotal = saleLines.reduce((sum, line) => {
    const product = data.products.find((item) => item.id === line.productId);
    const quantity = Number(line.quantity);
    return product && Number.isInteger(quantity) && quantity > 0 ? sum + product.price * quantity : sum;
  }, 0);
  const saleStockIssue = saleLines.some((line) => {
    const product = data.products.find((item) => item.id === line.productId);
    return product && (!Number.isInteger(Number(line.quantity)) || Number(line.quantity) <= 0 || Number(line.quantity) > product.stock);
  }) || data.products.some((product) => {
    const requested = saleLines.filter((line) => line.productId === product.id).reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    return requested > product.stock;
  });
  const saleReady = Boolean(saleCustomer && saleLines.length && saleLines.every((line) =>
    line.productId && Number.isInteger(Number(line.quantity)) && Number(line.quantity) > 0,
  ) && !saleStockIssue);

  const completeSale = () => {
    const customer = data.customers.find((item) => item.id === saleCustomer);
    if (!customer || !saleReady) {
      if (saleStockIssue) notify(t.insufficientStock);
      return;
    }
    const quantities = new Map<string, number>();
    saleLines.forEach((line) => quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + Number(line.quantity)));
    if ([...quantities].some(([id, quantity]) => quantity > (data.products.find((item) => item.id === id)?.stock ?? -1))) {
      notify(t.insufficientStock);
      return;
    }
    const items: SaleLine[] = saleLines.map((line) => {
      const product = data.products.find((item) => item.id === line.productId);
      return { productId: line.productId, quantity: Number(line.quantity), unitPrice: product?.price ?? 0 };
    });
    const sale: Sale = {
      id: `SW-${Date.now().toString().slice(-6)}`,
      customerId: customer.id,
      customerName: customer.name,
      date: new Date().toISOString(),
      items,
      total: Math.round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) / 100,
      status: 'completed',
    };
    setData((current) => ({
      ...current,
      products: current.products.map((product) => ({
        ...product,
        stock: product.stock - (quantities.get(product.id) ?? 0),
      })),
      sales: [sale, ...current.sales],
    }));
    setSaleModalOpen(false);
    setPage('sales');
    if (window.location.pathname !== pagePath('sales', language)) window.history.pushState({ path: pagePath('sales', language) }, '', pagePath('sales', language));
    notify(t.saleSuccess);
  };

  const resetDemo = () => {
    setData(structuredClone(initialData));
    setGlobalSearch('');
    setInventorySearch('');
    setCustomerSearch('');
    setSalesSearch('');
    setSalesCustomerFilter('');
    setInventoryCategory('all');
    setStockFilter('all');
    setReportCategory('all');
    setReportPeriod('all');
    setConfirmation(null);
    notify(t.dataReset);
  };

  const periodStart = () => {
    if (reportPeriod === 'all') return new Date(0);
    if (reportPeriod === 'year') return new Date(new Date().getFullYear(), 0, 1);
    const date = new Date();
    date.setDate(date.getDate() - Number(reportPeriod) + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const reportSales = latestSales.filter((sale) => new Date(sale.date) >= periodStart()).filter((sale) => {
    if (reportCategory === 'all') return true;
    return sale.items.some((item) => data.products.find((product) => product.id === item.productId)?.category === reportCategory);
  });
  const reportRevenue = reportSales.reduce((sum, sale) => sum + sale.items.reduce((amount, item) => {
    const product = data.products.find((current) => current.id === item.productId);
    return reportCategory === 'all' || product?.category === reportCategory ? amount + item.quantity * item.unitPrice : amount;
  }, 0), 0);
  const reportUnits = reportSales.reduce((sum, sale) => sum + sale.items.reduce((amount, item) => {
    const product = data.products.find((current) => current.id === item.productId);
    return reportCategory === 'all' || product?.category === reportCategory ? amount + item.quantity : amount;
  }, 0), 0);
  const reportBuckets = Array.from({ length: reportPeriod === 'year' ? 12 : reportPeriod === 'all' ? 6 : 7 }, (_, index) => {
    let start: Date;
    let end: Date;
    let label: string;
    if (reportPeriod === 'year') {
      const year = new Date().getFullYear();
      start = new Date(year, index, 1);
      end = new Date(year, index + 1, 1);
      label = t.monthNames[index];
    } else if (reportPeriod === 'all') {
      end = new Date();
      end.setMonth(end.getMonth() - (5 - index), 1);
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      label = t.monthNames[start.getMonth()];
    } else {
      const days = Number(reportPeriod);
      const bucketDays = days / 7;
      const rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - days + 1);
      rangeStart.setHours(0, 0, 0, 0);
      start = new Date(rangeStart);
      start.setDate(rangeStart.getDate() + Math.floor(index * bucketDays));
      end = new Date(rangeStart);
      end.setDate(rangeStart.getDate() + Math.floor((index + 1) * bucketDays));
      const labelDate = start;
      label = `${labelDate.getDate()} ${t.monthNames[labelDate.getMonth()]}`;
    }
    const amount = reportSales.reduce((sum, sale) => {
      const date = new Date(sale.date);
      if (date < start || date >= end) return sum;
      return sum + sale.items.reduce((lineSum, item) => {
        const product = data.products.find((current) => current.id === item.productId);
        return reportCategory === 'all' || product?.category === reportCategory ? lineSum + item.quantity * item.unitPrice : lineSum;
      }, 0);
    }, 0);
    return { label, amount };
  });
  const topProducts = data.products.map((product) => ({
    product,
    quantity: reportCategory !== 'all' && product.category !== reportCategory ? 0
      : reportSales.reduce((sum, sale) => sum + sale.items.filter((item) => item.productId === product.id).reduce((count, item) => count + item.quantity, 0), 0),
  })).filter((item) => item.quantity > 0).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const activityCustomers = data.customers.map((customer) => ({
    customer,
    orders: reportSales.filter((sale) => sale.customerId === customer.id).length,
  })).filter((item) => item.orders > 0).sort((a, b) => b.orders - a.orders).slice(0, 5);
  const reportDistribution = categories.map((category) => ({
    label: getCategoryLabel(t, category),
    value: data.products.filter((product) => product.category === category && (reportCategory === 'all' || product.category === reportCategory)).reduce((sum, product) => sum + product.stock, 0),
  })).filter((item) => item.value > 0);

  const sidebar = (
    <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} aria-label="Main navigation">
      <a className="brand" href={pagePath('dashboard', language)} onClick={(event) => { event.preventDefault(); navigate('dashboard'); }} aria-label="Velstock home">
        <span className="brand-mark"><Package size={18} strokeWidth={2.2} /></span><span className="brand-name">vel<span>stock</span></span>
      </a>
      <p className="nav-caption">{t.workspace}</p>
      <nav className="nav-list">
        {pages.slice(0, 3).map((item) => {
          const Icon = pageIcons[item];
          return <a key={item} className={`nav-link${page === item ? ' active' : ''}`} href={pagePath(item, language)} onClick={(event) => { event.preventDefault(); navigate(item); }} aria-current={page === item ? 'page' : undefined}><Icon /><span>{getPageLabel(t, item)}</span></a>;
        })}
      </nav>
      <p className="nav-caption" style={{ marginTop: 26 }}>{t.business}</p>
      <nav className="nav-list">
        {pages.slice(3).map((item) => {
          const Icon = pageIcons[item];
          return <a key={item} className={`nav-link${page === item ? ' active' : ''}`} href={pagePath(item, language)} onClick={(event) => { event.preventDefault(); navigate(item); }} aria-current={page === item ? 'page' : undefined}><Icon /><span>{getPageLabel(t, item)}</span></a>;
        })}
      </nav>
      <div className="sidebar-spacer" />
      <div className="workspace-card"><p className="workspace-card-title">{t.demo}</p><strong><span className="workspace-indicator" />Velstock Studio</strong><small>Demo workspace · {language === 'es' ? 'Plan gratuito' : 'Free plan'}</small></div>
      <div className="sidebar-profile"><span className="avatar">AM</span><span className="profile-meta"><strong>Alex Morgan</strong><small>{language === 'es' ? 'Administrador' : 'Workspace admin'}</small></span><MoreHorizontal size={17} color="#9695a2" /></div>
    </aside>
  );

  const pageHeading = (title: string, description: string, action?: ReactNode) => (
    <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div>{action && <div className="heading-actions">{action}</div>}</div>
  );

  const actionButton = (label: string, onClick: () => void, icon: ReactNode, primary = true) => (
    <button className={`button ${primary ? 'button-primary' : 'button-secondary'}`} onClick={onClick} type="button">{icon}<span className="button-label">{label}</span></button>
  );

  const productStatus = (product: Product) => {
    if (product.stock === 0) return <span className="badge badge-red">{t.out}</span>;
    if (isLowStock(product)) return <span className="badge badge-orange">{t.low}</span>;
    return <span className="badge badge-green">{t.inStock}</span>;
  };

  const recentTable = (sales: Sale[], compact = false, category = 'all') => (
    <div className={`table-wrap${compact ? ' compact-table' : ''}`}>
      {sales.length ? <table className="data-table">
        <thead><tr><th>{t.transaction}</th><th>{t.customer}</th><th>{t.date}</th><th>{t.amount}</th><th>{t.status}</th></tr></thead>
        <tbody>{sales.map((sale) => <tr key={sale.id}>
          <td><strong style={{ color: '#555461', fontWeight: 620 }}>{sale.id}</strong></td>
          <td><div className="customer-cell"><span className="mini-avatar">{initials(sale.customerName)}</span><strong>{sale.customerName}</strong></div></td>
          <td>{dateTime(sale.date, language)}</td><td><strong style={{ color: '#44434f', fontWeight: 650 }}>{money(category === 'all' ? sale.total : sale.items.reduce((sum, item) => {
            const product = data.products.find((current) => current.id === item.productId);
            return product?.category === category ? sum + item.quantity * item.unitPrice : sum;
          }, 0))}</strong></td>
          <td><span className="badge badge-green"><CircleCheck size={11} />{t.completed}</span></td>
        </tr>)}</tbody>
      </table> : <EmptyState title={t.noSales} description={t.noReportData} icon={ShoppingCart} />}
    </div>
  );

  const dashboardView = (
    <>
      <div className="welcome-row">
        <div><h1>{t.welcome}<span style={{ color: '#e9a25a' }}>.</span></h1><p>{t.dashboardSubtitle}</p></div>
        <div className="heading-actions">{actionButton(t.newSale, openNewSale, <Plus size={15} />)}</div>
      </div>
      <section className="metric-grid" aria-label="Store performance">
        {[
          { label: t.totalRevenue, value: money(totalRevenue), foot: revenueChange === null ? `${data.sales.length} ${t.orders}` : `${revenueChange >= 0 ? '+' : ''}${revenueChange}% ${t.vsLastMonth}`, icon: DollarSign, color: '', positive: revenueChange === null || revenueChange >= 0 },
          { label: t.salesCount, value: data.sales.length.toLocaleString(language === 'es' ? 'es-ES' : 'en-US'), foot: revenueChange === null ? t.completed : `${weekSales.length} ${language === 'es' ? 'esta semana' : 'this week'}`, icon: ShoppingCart, color: 'green', positive: true },
          { label: t.totalProducts, value: data.products.length.toLocaleString(language === 'es' ? 'es-ES' : 'en-US'), foot: `${money(inventoryValue)} ${language === 'es' ? 'en existencias' : 'in stock value'}`, icon: Package, color: 'blue', positive: true },
          { label: t.lowStock, value: lowStockCount.toLocaleString(language === 'es' ? 'es-ES' : 'en-US'), foot: `${data.products.filter((product) => product.stock === 0).length} ${t.out.toLowerCase()}`, icon: TrendingUp, color: 'orange', positive: false },
        ].map((metric) => {
          const Icon = metric.icon;
          return <article className="card metric-card" key={metric.label}>
            <div className="metric-label-row"><span>{metric.label}</span><span className={`metric-icon ${metric.color}`}><Icon /></span></div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-foot">{metric.positive ? <ArrowUpRight size={12} className="metric-change" /> : <ArrowDownRight size={12} style={{ color: '#d58a45' }} />}<span className={metric.positive ? 'metric-change' : ''}>{metric.foot}</span></div>
          </article>;
        })}
      </section>
      <div className="dashboard-grid">
        <section className="card chart-card">
          <div className="card-header"><div><h2 className="card-title">{t.salesOverview}</h2><p className="card-subtitle">{t.last7Days}</p></div><span className="chart-legend">{t.revenue}</span></div>
          <RevenueChart values={dashboardDaily.map((item) => item.amount)} labels={dayLabels} />
        </section>
        <section className="card chart-card">
          <div className="card-header"><div><h2 className="card-title">{t.inventoryOverview}</h2><p className="card-subtitle">{data.products.reduce((sum, product) => sum + product.stock, 0)} {t.units}</p></div><a className="text-button" href={pagePath('inventory', language)} onClick={(event) => { event.preventDefault(); navigate('inventory'); }}>{t.viewAll}</a></div>
          <CategoryChart values={categoryDistribution} colors={chartColors} unitLabel={t.units} chartLabel={t.inventoryOverview} />
        </section>
      </div>
      <section className="card recent-card">
        <div className="card-header"><div><h2 className="card-title">{t.recentTransactions}</h2><p className="card-subtitle">{language === 'es' ? 'Actividad reciente de tu tienda' : 'Latest activity from your store'}</p></div><a className="text-button" href={pagePath('sales', language)} onClick={(event) => { event.preventDefault(); navigate('sales'); }}>{t.viewAll}<ChevronRight size={12} /></a></div>
        {recentTable(latestSales.slice(0, 5), true)}
      </section>
    </>
  );

  const inventoryView = (
    <>
      {pageHeading(t.inventory, t.inventoryPageDescription, actionButton(t.addProduct, () => setProductModal(null), <Plus size={15} />))}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">{t.catalog} <span style={{ color: '#a09fab', fontWeight: 450 }}>({filteredProducts.length})</span></h2>
          <div className="filter-row">
            <label className="search-field"><Search size={14} /><span className="sr-only">{t.searchProducts}</span><input value={inventorySearch} onChange={(event) => { setInventorySearch(event.target.value); setGlobalSearch(event.target.value); }} placeholder={t.searchProducts} /></label>
            <select className="select-control compact" aria-label={t.categoryFilter} value={inventoryCategory} onChange={(event) => setInventoryCategory(event.target.value)}>
              <option value="all">{t.allCategories}</option>{categories.map((category) => <option key={category} value={category}>{getCategoryLabel(t, category)}</option>)}
            </select>
            <select className="select-control compact" aria-label={t.status} value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)}>
              <option value="all">{t.allStock}</option><option value="in-stock">{t.inStock}</option><option value="low-stock">{t.low}</option><option value="out-of-stock">{t.out}</option>
            </select>
          </div>
        </div>
        {filteredProducts.length ? <div className="table-wrap">
          <table className="data-table">
            <thead><tr>
              <th><button onClick={() => toggleSort('name')}>{t.product}<ArrowUpDown size={11} /></button></th>
              <th><button onClick={() => toggleSort('sku')}>{t.sku}<ArrowUpDown size={11} /></button></th>
              <th><button onClick={() => toggleSort('category')}>{t.category}<ArrowUpDown size={11} /></button></th>
              <th><button onClick={() => toggleSort('price')}>{t.price}<ArrowUpDown size={11} /></button></th>
              <th><button onClick={() => toggleSort('stock')}>{t.stock}<ArrowUpDown size={11} /></button></th><th>{t.status}</th><th style={{ textAlign: 'right' }}>{t.actions}</th>
            </tr></thead>
            <tbody>{filteredProducts.map((product, index) => <tr key={product.id}>
              <td><button className="table-product" style={{ padding: 0, border: 0, textAlign: 'left', background: 'transparent' }} onClick={() => setProductDetails(product)}>
                <span className="product-thumb" style={{ background: index % 3 === 1 ? '#edf7f6' : index % 3 === 2 ? '#fff4e9' : undefined, color: index % 3 === 1 ? '#499a8c' : undefined }}><Package size={15} /></span>
                <span><strong>{product.name}</strong><small>{money(product.price)} {language === 'es' ? 'por unidad' : 'per unit'}</small></span>
              </button></td>
              <td>{product.sku}</td><td>{getCategoryLabel(t, product.category)}</td>
              <td><strong style={{ color: '#514f5c', fontWeight: 620 }}>{money(product.price)}</strong></td>
              <td><strong style={{ color: product.stock <= product.minStock ? '#be7429' : '#504f5b', fontWeight: 620 }}>{product.stock}</strong><span className="currency-flag"> / {product.minStock} min</span><div className="stock-progress"><span style={{ width: `${Math.min(product.stock / Math.max(product.minStock * 2, 1) * 100, 100)}%`, background: product.stock === 0 ? '#dc6262' : isLowStock(product) ? '#e5a450' : undefined }} /></div></td>
              <td>{productStatus(product)}</td>
              <td><div className="table-actions"><button title={t.view} aria-label={`${t.view}: ${product.name}`} onClick={() => setProductDetails(product)}><Eye size={14} /></button><button title={t.edit} aria-label={`${t.edit}: ${product.name}`} onClick={() => setProductModal(product)}><Pencil size={14} /></button><button title={t.delete} aria-label={`${t.delete}: ${product.name}`} onClick={() => requestDeleteProduct(product)}><Trash2 size={14} /></button></div></td>
            </tr>)}</tbody>
          </table>
          <div className="table-footer"><span>{t.showing} {filteredProducts.length} {t.of} {data.products.length} {t.products}</span><span>{lowStockCount} {t.low.toLowerCase()}</span></div>
        </div> : <EmptyState title={t.noProducts} description={t.trySearch} />}
      </section>
    </>
  );

  const salesView = (
    <>
      {pageHeading(t.sales, t.salesPageDescription, actionButton(t.createSale, openNewSale, <Plus size={15} />))}
      <section className="report-kpis">
        <div className="card report-kpi"><span>{t.netSales}</span><strong>{money(totalRevenue)}</strong></div>
        <div className="card report-kpi"><span>{t.salesCount}</span><strong>{data.sales.length}</strong></div>
        <div className="card report-kpi"><span>{t.averageOrder}</span><strong>{money(data.sales.length ? totalRevenue / data.sales.length : 0)}</strong></div>
      </section>
      <section className="card">
        <div className="card-header"><div><h2 className="card-title">{t.salesHistory}</h2><p className="card-subtitle">{filteredSales.length} {t.orders}</p></div>
          <div className="filter-row">
            {salesCustomerFilter && <button className="button button-secondary" type="button" onClick={() => setSalesCustomerFilter('')}>{data.customers.find((customer) => customer.id === salesCustomerFilter)?.name ?? t.allCustomers}<X size={13} /></button>}
            <label className="search-field"><Search size={14} /><span className="sr-only">{t.searchTransactions}</span><input value={salesSearch} onChange={(event) => setSalesSearch(event.target.value)} placeholder={t.searchTransactions} /></label>
          </div>
        </div>
        {recentTable(filteredSales)}
      </section>
    </>
  );

  const customersView = (
    <>
      {pageHeading(t.customers, t.customersPageDescription, actionButton(t.addCustomer, () => setCustomerModal(null), <Plus size={15} />))}
      <section className="card">
        <div className="card-header"><div><h2 className="card-title">{t.customers} <span style={{ color: '#a09fab', fontWeight: 450 }}>({filteredCustomers.length})</span></h2></div>
          <div className="filter-row"><label className="search-field"><Search size={14} /><span className="sr-only">{t.searchCustomers}</span><input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder={t.searchCustomers} /></label>
          </div>
        </div>
        {filteredCustomers.length ? <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>{t.customer}</th><th>{t.email}</th><th>{t.company}</th><th>{t.phone}</th><th>{t.registered}</th><th>{t.salesCount}</th><th style={{ textAlign: 'right' }}>{t.actions}</th></tr></thead>
            <tbody>{filteredCustomers.map((customer) => {
              const orders = data.sales.filter((sale) => sale.customerId === customer.id);
              return <tr key={customer.id}>
                <td><button className="customer-cell" style={{ border: 0, padding: 0, background: 'transparent' }} onClick={() => setCustomerDetails(customer)}><span className="mini-avatar">{initials(customer.name)}</span><strong>{customer.name}</strong></button></td>
                <td>{customer.email}</td><td>{customer.company}</td><td>{customer.phone}</td><td>{dateLabel(customer.registeredAt)}</td><td>{orders.length}</td>
                <td><div className="table-actions"><button title={t.view} aria-label={`${t.view}: ${customer.name}`} onClick={() => setCustomerDetails(customer)}><Eye size={14} /></button><button title={t.edit} aria-label={`${t.edit}: ${customer.name}`} onClick={() => setCustomerModal(customer)}><Pencil size={14} /></button><button title={t.delete} aria-label={`${t.delete}: ${customer.name}`} onClick={() => requestDeleteCustomer(customer)}><Trash2 size={14} /></button></div></td>
              </tr>;
            })}</tbody>
          </table>
          <div className="table-footer"><span>{t.showing} {filteredCustomers.length} {t.of} {data.customers.length} {t.customers.toLowerCase()}</span><span>{data.customers.length} {t.allCustomers.toLowerCase()}</span></div>
        </div> : <EmptyState title={t.noCustomers} description={t.trySearch} />}
      </section>
    </>
  );

  const reportsView = (
    <>
      {pageHeading(t.reports, t.reportsPageDescription, <div className="report-filter-row">
        <select className="select-control compact" aria-label={t.period} value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)}>
          <option value="30">{t.last30Days}</option><option value="90">{t.last90Days}</option><option value="year">{t.thisYear}</option><option value="all">{t.allTime}</option>
        </select>
        <select className="select-control compact" aria-label={t.categoryFilter} value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}>
          <option value="all">{t.allCategories}</option>{categories.map((category) => <option key={category} value={category}>{getCategoryLabel(t, category)}</option>)}
        </select>
      </div>)}
      <section className="report-kpis">
        <div className="card report-kpi"><span>{t.totalRevenue}</span><strong>{money(reportRevenue)}</strong></div>
        <div className="card report-kpi"><span>{t.orders}</span><strong>{reportSales.length}</strong></div>
        <div className="card report-kpi"><span>{t.unitsSold}</span><strong>{reportUnits}</strong></div>
      </section>
      <div className="report-grid">
        <section className="card report-card"><div className="card-header"><div><h2 className="card-title">{t.revenueTrends}</h2><p className="card-subtitle">{t.salesByPeriod}</p></div></div>
          {reportRevenue ? <RevenueChart values={reportBuckets.map((bucket) => bucket.amount)} labels={reportBuckets.map((bucket) => bucket.label)} /> : <EmptyState title={t.noReportData} description={t.trySearch} />}
        </section>
        <section className="card report-card"><div className="card-header"><div><h2 className="card-title">{t.inventoryDistribution}</h2><p className="card-subtitle">{t.stockValue}: {money(inventoryValue)}</p></div></div>
          {reportDistribution.length ? <CategoryChart values={reportDistribution} colors={chartColors} unitLabel={t.units} chartLabel={t.inventoryDistribution} /> : <EmptyState title={t.noReportData} description={t.trySearch} />}
        </section>
      </div>
      <div className="report-grid">
        <section className="card report-card"><div className="card-header"><div><h2 className="card-title">{t.topProducts}</h2><p className="card-subtitle">{t.unitsSold}</p></div></div>
          {topProducts.length ? <MiniBars values={topProducts.map((item) => item.quantity)} labels={topProducts.map((item) => item.product.name)} colors={chartColors} /> : <EmptyState title={t.noReportData} description={t.trySearch} />}
        </section>
        <section className="card report-card"><div className="card-header"><div><h2 className="card-title">{t.customerActivity}</h2><p className="card-subtitle">{t.orders}</p></div></div>
          {activityCustomers.length ? <MiniBars values={activityCustomers.map((item) => item.orders)} labels={activityCustomers.map((item) => item.customer.name)} colors={chartColors} /> : <EmptyState title={t.noReportData} description={t.trySearch} />}
        </section>
      </div>
      <section className="card report-table-card"><div className="card-header"><div><h2 className="card-title">{t.salesByPeriod}</h2><p className="card-subtitle">{reportSales.length} {t.orders}</p></div></div>
        {reportSales.length ? recentTable(reportSales.slice(0, 8), true, reportCategory) : <EmptyState title={t.noReportData} description={t.trySearch} />}
      </section>
    </>
  );

  const settingsView = (
    <>
      {pageHeading(t.settings, t.settingsPageDescription)}
      <div className="card" style={{ maxWidth: 760, overflow: 'hidden' }}>
        <section className="settings-section"><h3>{t.preferences}</h3><p>{t.saveSettings}</p>
          <div className="settings-options">
            <label><span className="field-label">{t.language}</span><select className="select-control" value={language} onChange={(event) => changeLanguage(event.target.value as Language)}><option value="en">{t.english}</option><option value="es">{t.spanish}</option></select></label>
            <label><span className="field-label">{t.currency}</span><select className="select-control" value={currencyCode} onChange={(event) => { setCurrencyCode(event.target.value); notify(copy[language].currencyChanged); }}>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
              <option value="ARS">ARS — Argentine Peso ($)</option>
              <option value="BRL">BRL — Brazilian Real (R$)</option>
              <option value="CLP">CLP — Chilean Peso ($)</option>
              <option value="COP">COP — Colombian Peso ($)</option>
              <option value="MXN">MXN — Mexican Peso ($)</option>
            </select></label>
          </div>
        </section>
        <section className="settings-section"><h3>{t.demoData}</h3><p>{t.resetDescription}</p>
          <button type="button" className="button button-secondary" onClick={() => setConfirmation({ title: t.resetDemo, description: t.resetDescription, action: resetDemo })}><RotateCcw size={14} />{t.resetDemo}</button>
          <p className="sale-note">{t.demoNotice}</p>
        </section>
      </div>
      <div className="card" style={{ maxWidth: 760, marginTop: 14, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span className="metric-icon orange"><CircleHelp size={15} /></span><div><h3 style={{ margin: '3px 0 0', fontSize: 11 }}>{t.demo}</h3><p style={{ margin: '5px 0 0', color: '#8e8d9a', fontSize: 10, lineHeight: 1.6 }}>{t.demoNotice} {language === 'es' ? 'Esta aplicación no utiliza servicios externos ni guarda información personal.' : 'This app uses no external services and does not save personal information.'}</p></div>
      </div>
    </>
  );

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return dashboardView;
      case 'inventory': return inventoryView;
      case 'sales': return salesView;
      case 'customers': return customersView;
      case 'reports': return reportsView;
      case 'settings': return settingsView;
    }
  };

  return (
    <div className="app-shell">
      {sidebar}
      <button className={`mobile-overlay${sidebarOpen ? ' show' : ''}`} aria-label={t.close} onClick={() => setSidebarOpen(false)} />
      <div className="main-shell">
        <header className="topbar">
          <button type="button" className="icon-button mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label={t.workspace}><Menu size={17} /></button>
          <div className="breadcrumbs"><span>Velstock</span><ChevronRight size={12} /><strong>{getPageLabel(t, page)}</strong></div>
          <div className="topbar-right">
            <label className="global-search"><Search size={14} /><span className="sr-only">{t.search}</span><input value={globalSearch} onChange={(event) => handleGlobalSearch(event.target.value)} placeholder={t.search} /></label>
            <button type="button" className="icon-button" onClick={() => changeLanguage(language === 'en' ? 'es' : 'en')} aria-label={language === 'en' ? t.spanish : t.english}><Languages size={16} /><span className="sr-only">{t.language}</span></button>
            <span className="avatar topbar-avatar">AM</span>
          </div>
        </header>
        <main className="content">{renderPage()}</main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">{pages.slice(0, 5).map((item) => {
        const Icon = pageIcons[item];
        return <a key={item} className={page === item ? 'active' : ''} href={pagePath(item, language)} onClick={(event) => { event.preventDefault(); navigate(item); }} aria-current={page === item ? 'page' : undefined}><Icon /><span>{getPageLabel(t, item)}</span></a>;
      })}</nav>
      <div className="toast-region" aria-live="polite" aria-atomic="false">{toasts.map((toast) => <div className="toast" key={toast.id}><Check size={15} />{toast.text}</div>)}</div>

      {productModal !== undefined && <ProductForm
        key={productModal?.id ?? 'new-product'}
        product={productModal ?? null}
        t={t}
        money={money}
        onSubmit={saveProduct}
        onClose={() => setProductModal(undefined)}
        existingSkus={data.products.filter((item) => item.id !== productModal?.id).map((item) => item.sku)}
      />}
      {productDetails && <Modal title={t.productDetails} description={productDetails.sku} onClose={() => setProductDetails(null)}
        footer={<><button className="button button-secondary" onClick={() => setProductDetails(null)} type="button">{t.close}</button><button className="button button-primary" onClick={() => { setProductModal(productDetails); setProductDetails(null); }} type="button"><Pencil size={14} />{t.edit}</button></>}>
        <div className="modal-body"><div className="detail-grid">
          <div><span>{t.product}</span><strong>{productDetails.name}</strong></div><div><span>{t.category}</span><strong>{getCategoryLabel(t, productDetails.category)}</strong></div>
          <div><span>{t.price}</span><strong>{money(productDetails.price)}</strong></div><div><span>{t.stock}</span><strong>{productDetails.stock} {t.units}</strong></div>
          <div><span>{t.minStock}</span><strong>{productDetails.minStock} {t.units}</strong></div><div><span>{t.status}</span><strong>{productStatus(productDetails)}</strong></div>
        </div></div>
      </Modal>}
      {customerModal !== undefined && <CustomerForm key={customerModal?.id ?? 'new-customer'} customer={customerModal ?? null} t={t} onSubmit={saveCustomer} onClose={() => setCustomerModal(undefined)} />}
      {customerDetails && <CustomerDetails
        customer={customerDetails} sales={latestSales.filter((sale) => sale.customerId === customerDetails.id)}
        t={t} money={money} language={language} onClose={() => setCustomerDetails(null)}
        onEdit={() => { setCustomerModal(customerDetails); setCustomerDetails(null); }}
        onFilter={() => { setSalesCustomerFilter(customerDetails.id); setCustomerDetails(null); navigate('sales'); }}
      />}
      {saleModalOpen && <SaleForm
        t={t} products={data.products} customers={data.customers} currencyCode={currencyCode} language={language}
        customer={saleCustomer} setCustomer={setSaleCustomer} lines={saleLines} setLines={setSaleLines}
        total={saleSubtotal} stockIssue={saleStockIssue} ready={saleReady} onConfirm={completeSale} onClose={() => setSaleModalOpen(false)}
      />}
      {confirmation && <Modal title={confirmation.title} description={confirmation.description} onClose={() => setConfirmation(null)}
        footer={<><button className="button button-secondary" type="button" onClick={() => setConfirmation(null)}>{t.cancel}</button><button className={`button ${confirmation.danger ? 'button-danger' : 'button-primary'}`} type="button" onClick={confirmation.action}>{confirmation.danger ? <Trash2 size={14} /> : <RotateCcw size={14} />}{t.confirm}</button></>}>
        <div className="modal-body"><div style={{ display: 'flex', gap: 10, alignItems: 'center', color: confirmation.danger ? '#bc6464' : '#d69045', fontSize: 11 }}><Filter size={16} />{confirmation.danger ? t.deleteConfirm : t.resetDescription}</div></div>
      </Modal>}
    </div>
  );
}

function ProductForm({ product, t, money, onSubmit, onClose, existingSkus }: {
  product: Product | null;
  t: typeof copy.en | typeof copy.es;
  money: (value: number) => string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  existingSkus: string[];
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validate = (event: FormEvent<HTMLFormElement>) => {
    const form = new FormData(event.currentTarget);
    const next: Record<string, string> = {};
    if (!String(form.get('name') ?? '').trim()) next.name = t.required;
    const sku = String(form.get('sku') ?? '').trim();
    if (!sku) next.sku = t.required;
    else if (existingSkus.some((item) => item.toLowerCase() === sku.toLowerCase())) next.sku = t.duplicateSku;
    const price = Number(form.get('price'));
    if (!Number.isFinite(price) || price < 0 || String(form.get('price')) === '') next.price = t.invalidPrice;
    const stock = Number(form.get('stock'));
    if (!Number.isInteger(stock) || stock < 0 || String(form.get('stock')) === '') next.stock = t.invalidQuantity;
    const min = Number(form.get('minStock'));
    if (!Number.isInteger(min) || min < 0 || String(form.get('minStock')) === '') next.minStock = t.invalidQuantity;
    setErrors(next);
    if (!Object.keys(next).length) onSubmit(event);
    else event.preventDefault();
  };
  return <Modal title={product ? t.edit : t.addProduct} description={product ? product.sku : t.inventoryPageDescription} onClose={onClose}
    footer={<><button className="button button-secondary" type="button" onClick={onClose}>{t.cancel}</button><button className="button button-primary" form="product-form" type="submit">{product ? t.update : t.create}</button></>}>
    <form className="modal-body" id="product-form" onSubmit={validate} noValidate>
      <div className="form-grid">
        <FormField label={t.name} error={errors.name}><input className="input-control" name="name" defaultValue={product?.name ?? ''} autoFocus /></FormField>
        <FormField label={t.sku} error={errors.sku}><input className="input-control" name="sku" defaultValue={product?.sku ?? ''} /></FormField>
        <FormField label={t.category}><select className="select-control" name="category" defaultValue={product?.category ?? 'Electronics'}>{categories.map((category) => <option key={category} value={category}>{getCategoryLabel(t, category)}</option>)}</select></FormField>
        <FormField label={t.price} error={errors.price}><input className="input-control" name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? ''} placeholder={money(0)} /></FormField>
        <FormField label={t.stock} error={errors.stock}><input className="input-control" name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? ''} /></FormField>
        <FormField label={t.minStock} error={errors.minStock}><input className="input-control" name="minStock" type="number" min="0" step="1" defaultValue={product?.minStock ?? ''} /></FormField>
      </div>
    </form>
  </Modal>;
}

function CustomerForm({ customer, t, onSubmit, onClose }: {
  customer: Customer | null;
  t: typeof copy.en | typeof copy.es;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validate = (event: FormEvent<HTMLFormElement>) => {
    const form = new FormData(event.currentTarget);
    const next: Record<string, string> = {};
    if (!String(form.get('name') ?? '').trim()) next.name = t.required;
    const email = String(form.get('email') ?? '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t.invalidEmail;
    if (!String(form.get('phone') ?? '').trim()) next.phone = t.required;
    if (!String(form.get('company') ?? '').trim()) next.company = t.required;
    setErrors(next);
    if (!Object.keys(next).length) onSubmit(event);
    else event.preventDefault();
  };
  return <Modal title={customer ? t.edit : t.addCustomer} description={t.customerDetails} onClose={onClose}
    footer={<><button className="button button-secondary" type="button" onClick={onClose}>{t.cancel}</button><button className="button button-primary" form="customer-form" type="submit">{customer ? t.update : t.create}</button></>}>
    <form className="modal-body" id="customer-form" onSubmit={validate} noValidate>
      <div className="form-grid">
        <FormField label={t.name} error={errors.name}><input className="input-control" name="name" defaultValue={customer?.name ?? ''} autoFocus /></FormField>
        <FormField label={t.email} error={errors.email}><input className="input-control" name="email" type="email" defaultValue={customer?.email ?? ''} /></FormField>
        <FormField label={t.phone} error={errors.phone}><input className="input-control" name="phone" type="tel" defaultValue={customer?.phone ?? ''} /></FormField>
        <FormField label={t.company} error={errors.company}><input className="input-control" name="company" defaultValue={customer?.company ?? ''} /></FormField>
      </div>
    </form>
  </Modal>;
}

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="form-field"><span className="field-label">{label}</span>{children}{error && <span className="field-error" role="alert">{error}</span>}</label>;
}

function CustomerDetails({ customer, sales, t, money, language, onClose, onEdit, onFilter }: {
  customer: Customer;
  sales: Sale[];
  t: typeof copy.en | typeof copy.es;
  money: (value: number) => string;
  language: Language;
  onClose: () => void;
  onEdit: () => void;
  onFilter: () => void;
}) {
  return <Modal title={t.customerDetails} description={customer.company} onClose={onClose}
    footer={<><button className="button button-secondary" type="button" onClick={onClose}>{t.close}</button><button className="button button-primary" type="button" onClick={onEdit}><Pencil size={14} />{t.edit}</button></>}>
    <div className="modal-body">
      <div className="customer-detail-head"><span className="avatar">{initials(customer.name)}</span><div><strong>{customer.name}</strong><span>{customer.company}</span></div></div>
      <div className="detail-grid">
        <div><span>{t.email}</span><strong>{customer.email}</strong></div><div><span>{t.phone}</span><strong>{customer.phone}</strong></div>
        <div><span>{t.customerSince}</span><strong>{shortDate(customer.registeredAt, language)}</strong></div><div><span>{t.salesCount}</span><strong>{sales.length}</strong></div>
      </div>
      <div className="card-header" style={{ padding: '18px 0 10px' }}><h3 className="card-title">{t.purchaseHistory}</h3><button type="button" className="text-button" onClick={onFilter}>{t.viewAll}</button></div>
      {sales.length ? <div style={{ display: 'grid', gap: 7 }}>{sales.slice(0, 4).map((sale) => <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 10px', borderRadius: 8, background: '#fafafd' }}><div><strong style={{ display: 'block', fontSize: 10 }}>{sale.id}</strong><span style={{ display: 'block', marginTop: 3, color: '#9b9aa6', fontSize: 9 }}>{shortDate(sale.date, language)}</span></div><strong style={{ fontSize: 10 }}>{money(sale.total)}</strong></div>)}</div> : <p className="sale-note">{t.noHistory}</p>}
    </div>
  </Modal>;
}

function SaleForm({ t, products, customers, currencyCode, language, customer, setCustomer, lines, setLines, total, stockIssue, ready, onConfirm, onClose }: {
  t: typeof copy.en | typeof copy.es;
  products: Product[];
  customers: Customer[];
  currencyCode: string;
  language: Language;
  customer: string;
  setCustomer: (value: string) => void;
  lines: SaleDraftLine[];
  setLines: (value: SaleDraftLine[] | ((current: SaleDraftLine[]) => SaleDraftLine[])) => void;
  total: number;
  stockIssue: boolean;
  ready: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const money = (value: number) => currency(value, currencyCode, language);
  const updateLine = (index: number, key: keyof SaleDraftLine, value: string) => setLines((current) => current.map((line, position) => position === index ? { ...line, [key]: value } : line));
  const lineProblem = (line: SaleDraftLine) => {
    const product = products.find((item) => item.id === line.productId);
    return product && (!Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1 || Number(line.quantity) > product.stock);
  };
  return <Modal title={t.createSale} description={t.saleDescription} onClose={onClose} wide
    footer={<><button className="button button-secondary" type="button" onClick={onClose}>{t.cancel}</button><button className="button button-primary" type="button" onClick={onConfirm} disabled={!ready}><Check size={14} />{t.confirmSale}</button></>}>
    <div className="modal-body">
      <FormField label={t.customer}><select className="select-control" value={customer} onChange={(event) => setCustomer(event.target.value)}><option value="">{t.selectCustomer}</option>{customers.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.company}</option>)}</select></FormField>
      <div className="sale-lines">{lines.map((line, index) => {
        const product = products.find((item) => item.id === line.productId);
        const invalid = lineProblem(line);
        return <div className="sale-line" key={index}>
          <label><span className="field-label">{t.product}</span><select className="select-control" value={line.productId} onChange={(event) => updateLine(index, 'productId', event.target.value)}><option value="">{t.selectProduct}</option>{products.filter((item) => item.stock > 0 || item.id === line.productId).map((item) => <option key={item.id} value={item.id} disabled={item.stock === 0}>{item.name} · {item.stock} {t.units}</option>)}</select></label>
          <label><span className="field-label">{t.quantity}</span><input className="input-control" type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} /></label>
          <label><span className="field-label">{t.subtotal}</span><input className="input-control" value={product ? money(product.price * Number(line.quantity || 0)) : money(0)} readOnly /></label>
          <button type="button" className="icon-close" aria-label={t.remove} onClick={() => setLines((current) => current.length > 1 ? current.filter((_, position) => position !== index) : [{ productId: '', quantity: '1' }])}><Minus size={14} /></button>
          {invalid && <span className="field-error" style={{ gridColumn: '1 / -1', marginTop: -4 }}>{t.insufficientStock}</span>}
        </div>;
      })}</div>
      <button type="button" className="text-button" onClick={() => setLines((current) => [...current, { productId: '', quantity: '1' }])}><Plus size={13} /> {t.addLine}</button>
      <div className="sale-total"><span>{t.total}</span><strong>{money(total)}</strong></div>
      {stockIssue && <p className="field-error" role="alert">{t.insufficientStock}</p>}
      <p className="sale-note">{language === 'es' ? 'La venta actualiza las existencias de forma inmediata. No se realizará ningún pago real.' : 'This sale updates inventory immediately. No real payment will be processed.'}</p>
    </div>
  </Modal>;
}
