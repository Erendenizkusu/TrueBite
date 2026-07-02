import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * TrueBite — Maliyet güvenliği (RELEASE.md § A / altın kural) API sarmalayıcıları.
 *
 * İki bağımsız sayaç, SQL tarafında ATOMİK olarak yönetilir (bkz.
 * migrations/20260702120000_usage_cost_safety.sql). Buradaki fonksiyonlar yalnızca
 * ince RPC köprüleridir — mantık DB'de, verinin yanında.
 */

export interface QuotaResult {
  allowed: boolean;
  reason: string | null;
  used: number;
  limit: number;
  remaining: number;
}

export interface BudgetResult {
  allowed: boolean;
  dayCalls: number;
  dayBudget: number;
  monthCalls: number;
  monthBudget: number;
}

export interface GrantResult {
  granted: number;
  used: number;
  grants: number;
}

/**
 * Kullanıcı(cihaz) günlük kotasını atomik tüketir. İzin verilmezse SAYAÇ ARTMAZ
 * → istemci "reklam izle → +istek" akışına yönlendirilir.
 */
export async function consumeUserRequest(
  sb: SupabaseClient,
  clientId: string,
  freePerDay: number,
): Promise<QuotaResult> {
  const { data, error } = await sb.rpc("consume_user_request", {
    p_client_id: clientId,
    p_free_per_day: freePerDay,
  });
  if (error) throw new Error(`consume_user_request: ${error.message}`);
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    allowed: d.allowed === true,
    reason: (d.reason as string) ?? null,
    used: Number(d.used ?? 0),
    limit: Number(d.limit ?? 0),
    remaining: Number(d.remaining ?? 0),
  };
}

/** Reklam izleme karşılığı ek istek hakkı tanır (üretimde AdMob SSV ile korunmalı). */
export async function grantAdRequest(
  sb: SupabaseClient,
  clientId: string,
  grant: number,
): Promise<GrantResult> {
  const { data, error } = await sb.rpc("grant_ad_request", {
    p_client_id: clientId,
    p_grant: grant,
  });
  if (error) throw new Error(`grant_ad_request: ${error.message}`);
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    granted: Number(d.granted ?? 0),
    used: Number(d.used ?? 0),
    grants: Number(d.grants ?? 0),
  };
}

/**
 * Global günlük/aylık Google bütçe tavanını atomik kontrol + tüketir.
 * Cache-miss'ten ÖNCE çağrılır: false dönerse Google'a GİDİLMEZ (bayat/DB verisi servis edilir).
 */
export async function tryConsumeBudget(
  sb: SupabaseClient,
  calls: number,
  dailyBudget: number,
  monthlyBudget: number,
): Promise<BudgetResult> {
  const { data, error } = await sb.rpc("try_consume_budget", {
    p_calls: calls,
    p_daily_budget: dailyBudget,
    p_monthly_budget: monthlyBudget,
  });
  if (error) throw new Error(`try_consume_budget: ${error.message}`);
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    allowed: d.allowed === true,
    dayCalls: Number(d.day_calls ?? 0),
    dayBudget: Number(d.day_budget ?? 0),
    monthCalls: Number(d.month_calls ?? 0),
    monthBudget: Number(d.month_budget ?? 0),
  };
}
