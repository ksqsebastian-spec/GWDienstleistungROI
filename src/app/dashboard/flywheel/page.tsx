"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Config } from "@/lib/types";
import { CHANNELS, TIER_LABELS, TIER_COLORS, formatEuro, Channel, CartItem } from "@/lib/flywheel-data";
import Receipt from "@/components/Receipt";

export default function FlywheelPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalBudget, setTotalBudget] = useState(8000);
  const [loadedFromDB, setLoadedFromDB] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Load budget from DB
  useEffect(() => {
    async function loadData() {
      const [jobsRes, configRes] = await Promise.all([
        supabase.from("jobs").select("rohertrag"),
        supabase.from("config").select("*").limit(1).single(),
      ]);
      const jobs = (jobsRes.data || []) as { rohertrag: number | null }[];
      const config = configRes.data as Config | null;
      if (config && jobs.length > 0) {
        const totalRohertrag = jobs.reduce((s, j) => s + (j.rohertrag || 0), 0);
        const monthlyMarge = totalRohertrag * config.operative_marge_pct;
        if (monthlyMarge > 0) setTotalBudget(Math.round(monthlyMarge));
      }
      setLoadedFromDB(true);
    }
    loadData();
  }, []);

  // Cart helpers
  const isInCart = (channelId: string) => cart.some((i) => i.channelId === channelId);

  const addToCart = useCallback((channel: Channel) => {
    if (isInCart(channel.id)) return;
    setCart((prev) => [
      ...prev,
      { channelId: channel.id, amount: channel.defaultCost, pricing: channel.pricing },
    ]);
  }, [cart]);

  const removeFromCart = useCallback((channelId: string) => {
    setCart((prev) => prev.filter((i) => i.channelId !== channelId));
  }, []);

  const updateCartAmount = useCallback((channelId: string, amount: number) => {
    setCart((prev) =>
      prev.map((i) => (i.channelId === channelId ? { ...i, amount } : i))
    );
  }, []);

  const toggleCartPricing = useCallback((channelId: string) => {
    setCart((prev) =>
      prev.map((i) =>
        i.channelId === channelId
          ? { ...i, pricing: i.pricing === "recurring" ? "onetime" : "recurring" }
          : i
      )
    );
  }, []);

  // Purchase handler
  const handlePurchase = async () => {
    if (cart.length === 0) return;
    setPurchasing(true);
    setPurchaseSuccess(false);

    const now = new Date().toISOString();
    const rows = cart.map((item) => {
      const ch = CHANNELS.find((c) => c.id === item.channelId);
      return {
        channel_id: item.channelId,
        channel_name: ch?.nm || item.channelId,
        amount: item.amount,
        pricing: item.pricing,
        note: "",
        purchased_at: now,
      };
    });

    const { error } = await supabase.from("purchases").insert(rows);
    setPurchasing(false);
    if (!error) {
      setPurchaseSuccess(true);
      setCart([]);
      setTimeout(() => setPurchaseSuccess(false), 4000);
    }
  };

  // Budget calculations
  const recurringSpend = cart
    .filter((i) => i.pricing === "recurring")
    .reduce((s, i) => s + i.amount, 0);
  const onetimeSpend = cart
    .filter((i) => i.pricing === "onetime")
    .reduce((s, i) => s + i.amount, 0);
  const totalSpend = recurringSpend + onetimeSpend;
  const remaining = totalBudget - totalSpend;
  const spendPct = totalBudget > 0 ? Math.min(100, (totalSpend / totalBudget) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block px-3 py-1 bg-accent-light text-accent text-[10px] font-mono uppercase tracking-wider rounded-full mb-3">
          Marketing-Budget planen
        </span>
        <h2 className="text-3xl font-semibold text-text mb-2">
          Das <span className="text-accent italic">Flywheel</span>
        </h2>
        <p className="text-sm text-text-muted max-w-xl">
          Dein operativer Gewinn ist dein Marketing-Budget. Wähle Maßnahmen aus und erstelle deinen Marketing-Beleg.
        </p>
        {loadedFromDB && (
          <p className="text-[10px] font-mono text-text-dim mt-2">
            Budget aus ROI-Rechnung geladen (editierbar)
          </p>
        )}
      </div>

      {/* Budget Overview */}
      <div className="bg-surface border-2 border-accent rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">
              Verfügbares Marketing-Budget
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-text-dim">€</span>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-3xl font-semibold text-accent bg-transparent border-b-2 border-surface-3 focus:border-accent outline-none w-48"
                step={100}
              />
            </div>
            <p className="text-[10px] font-mono text-text-dim mt-1">Aus operativem Gewinn (ROI-Rechnung)</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-3 justify-end">
              <span className="text-[10px] font-mono text-text-dim">Monatlich</span>
              <span className="text-sm font-mono font-medium text-red">{formatEuro(recurringSpend)}</span>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <span className="text-[10px] font-mono text-text-dim">Einmalig</span>
              <span className="text-sm font-mono font-medium text-amber">{formatEuro(onetimeSpend)}</span>
            </div>
            <div className="flex items-center gap-3 justify-end pt-1 border-t border-border">
              <span className="text-[10px] font-mono text-text-dim">Verbleibend</span>
              <span className={`text-sm font-mono font-semibold ${remaining >= 0 ? "text-accent" : "text-red"}`}>
                {formatEuro(remaining)}
              </span>
            </div>
          </div>
        </div>
        <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${remaining >= 0 ? "bg-accent" : "bg-red"}`}
            style={{ width: `${Math.min(spendPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-mono text-text-dim">{Math.round(spendPct)}% ausgegeben</span>
          <span className="text-[10px] font-mono text-text-dim">{formatEuro(totalBudget)}</span>
        </div>
      </div>

      {/* Main layout: Shop + Receipt side by side */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Shop — 2 cols */}
        <div className="col-span-2">
          {[0, 1, 2, 3].map((tier) => {
            const tierChannels = CHANNELS.filter((c) => c.t === tier);
            if (tierChannels.length === 0) return null;
            const colors = TIER_COLORS[tier];
            return (
              <div key={tier}>
                <div className="flex items-center gap-2.5 my-5">
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider font-medium px-3.5 py-1 rounded-full"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {TIER_LABELS[tier]}
                  </span>
                </div>
                <div className={`grid gap-3 mb-1.5 ${tier === 0 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {tierChannels.map((ch) => {
                    const inCart = isInCart(ch.id);
                    const cartItem = cart.find((i) => i.channelId === ch.id);
                    const isEngine = tier === 0;
                    return (
                      <div
                        key={ch.id}
                        className={`bg-surface border rounded-xl p-5 transition-all relative overflow-hidden ${
                          inCart
                            ? isEngine ? "border-accent border-2 shadow-md" : "border-accent shadow-sm"
                            : isEngine ? "border-accent/50 border-2" : "border-border hover:border-border-hover hover:shadow-sm"
                        }`}
                      >
                        {isEngine && (
                          <div className="absolute top-2 right-4 text-[64px] font-semibold text-accent/5 leading-none">#1</div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`${isEngine ? "w-10 h-10" : "w-8 h-8"} rounded-lg flex items-center justify-center text-sm`}
                              style={{ backgroundColor: ch.cl, color: ch.co }}
                            >
                              ●
                            </div>
                            <div>
                              <p className={`font-semibold ${isEngine ? "text-base" : "text-[13px]"}`}>{ch.nm}</p>
                              <span
                                className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                  (cartItem?.pricing || ch.pricing) === "recurring"
                                    ? "bg-blue-light text-blue"
                                    : "bg-amber-light text-amber"
                                }`}
                              >
                                {(cartItem?.pricing || ch.pricing) === "recurring" ? "monatlich" : "einmalig"}
                              </span>
                            </div>
                          </div>
                          {inCart && (
                            <span className="text-accent text-lg">✓</span>
                          )}
                        </div>

                        <p className={`text-text-muted leading-relaxed mb-2 ${isEngine ? "text-xs" : "text-[11px]"}`}>
                          {ch.d}
                        </p>

                        <div
                          className="text-[10px] font-mono text-text-muted p-2 bg-surface-2 rounded-md leading-snug mb-3 border-l-2"
                          style={{ borderColor: ch.co }}
                        >
                          ↻ {ch.l}
                        </div>

                        {/* Price + Action */}
                        {inCart ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-text-dim">€</span>
                              <input
                                type="number"
                                value={cartItem!.amount}
                                onChange={(e) =>
                                  updateCartAmount(ch.id, Math.max(0, parseFloat(e.target.value) || 0))
                                }
                                className="flex-1 text-sm font-mono font-semibold bg-transparent border-b border-accent outline-none"
                                style={{ color: ch.co }}
                                step={ch.pricing === "recurring" ? 10 : 50}
                              />
                              <button
                                onClick={() => toggleCartPricing(ch.id)}
                                className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                                  cartItem!.pricing === "recurring"
                                    ? "bg-blue-light text-blue hover:bg-blue hover:text-white"
                                    : "bg-amber-light text-amber hover:bg-amber hover:text-white"
                                }`}
                              >
                                {cartItem!.pricing === "recurring" ? "monatl." : "einmal."}
                              </button>
                            </div>
                            <input
                              type="range"
                              min={ch.minCost}
                              max={ch.maxCost}
                              step={ch.pricing === "recurring" ? 5 : 25}
                              value={cartItem!.amount}
                              onChange={(e) =>
                                updateCartAmount(ch.id, parseFloat(e.target.value))
                              }
                              className="w-full"
                              style={{ accentColor: ch.co }}
                            />
                            <div className="flex justify-between text-[9px] font-mono text-text-dim">
                              <span>{formatEuro(ch.minCost)}</span>
                              <span>{formatEuro(ch.maxCost)}</span>
                            </div>
                            <button
                              onClick={() => removeFromCart(ch.id)}
                              className="text-[10px] font-mono text-red hover:text-text transition-colors"
                            >
                              Entfernen
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-text-dim">
                              {formatEuro(ch.minCost)}–{formatEuro(ch.maxCost)}
                            </span>
                            <button
                              onClick={() => addToCart(ch)}
                              className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                                isEngine ? "px-5 py-2 text-xs font-semibold" : ""
                              }`}
                              style={{
                                borderColor: ch.co + "40",
                                color: ch.co,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = ch.cl;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "";
                              }}
                            >
                              <span className="text-base leading-none">+</span> In den Warenkorb
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Receipt Sidebar — 1 col, sticky */}
        <div className="col-span-1">
          <div className="sticky top-20">
            <Receipt
              cart={cart}
              totalBudget={totalBudget}
            />

            {/* Purchase button */}
            {cart.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full py-3 bg-accent text-white rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {purchasing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Wird gebucht...
                    </>
                  ) : (
                    <>Jetzt kaufen</>
                  )}
                </button>
                {purchaseSuccess && (
                  <p className="text-xs font-mono text-accent text-center mt-2">
                    Einkauf gespeichert — siehe Ausgaben-Tab
                  </p>
                )}
              </div>
            )}

            {/* Compound loops for items in cart */}
            {cart.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-5 mt-4">
                <h4 className="text-xs font-semibold mb-3">Aktivierte Schleifen</h4>
                <div className="space-y-1.5">
                  {cart.map((item) => {
                    const ch = CHANNELS.find((c) => c.id === item.channelId);
                    if (!ch) return null;
                    return (
                      <div
                        key={item.channelId}
                        className="flex gap-2 items-start text-[10px] leading-relaxed text-text-muted"
                      >
                        <span className="shrink-0 mt-px" style={{ color: ch.co }}>●</span>
                        <span><strong className="text-text font-medium">{ch.nm}</strong> — {ch.cp}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
