"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/useTranslation";

export default function HomePage() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <div>
      <section className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          <span className="text-indigo-600">GOGO</span> Invoice
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-lg">
          {t("home", "subtitle")}
        </p>
        <div className="flex gap-4">
          {session ? (
            <Link href="/dashboard" className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              {t("nav", "dashboard")}
            </Link>
          ) : (
            <>
              <Link href="/register" className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                {t("home", "getStarted")}
              </Link>
              <Link href="/login" className="bg-white text-gray-700 px-8 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors">
                {t("home", "signIn")}
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto pb-16">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-3">&#x1F4C4;</div>
          <h3 className="font-semibold text-gray-900 mb-2">{t("home", "createInvoices")}</h3>
          <p className="text-sm text-gray-600">{t("home", "createInvoicesDesc")}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-3">&#x1F465;</div>
          <h3 className="font-semibold text-gray-900 mb-2">{t("home", "manageClients")}</h3>
          <p className="text-sm text-gray-600">{t("home", "manageClientsDesc")}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl mb-3">&#x1F4CA;</div>
          <h3 className="font-semibold text-gray-900 mb-2">{t("home", "trackRevenue")}</h3>
          <p className="text-sm text-gray-600">{t("home", "trackRevenueDesc")}</p>
        </div>
      </section>

      <section className="bg-indigo-600 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Built for South African Businesses</h2>
          <p className="text-indigo-100 text-lg mb-8">ZAR currency by default, WhatsApp integration, SARS-ready tax reports, multi-language support.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-10">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">ZAR</p>
              <p className="text-sm text-indigo-200">Default Currency</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">7</p>
              <p className="text-sm text-indigo-200">Languages</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">PDF</p>
              <p className="text-sm text-indigo-200">Invoice Export</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">WA</p>
              <p className="text-sm text-indigo-200">Share via WhatsApp</p>
            </div>
          </div>
          {!session && (
            <Link href="/register" className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
              Start Invoicing Free
            </Link>
          )}
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Your Account</h3>
              <p className="text-sm text-gray-600">Sign up in seconds. Free to start, no credit card needed.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Add Clients &amp; Invoices</h3>
              <p className="text-sm text-gray-600">Manage your clients and create professional invoices quickly.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Send &amp; Get Paid</h3>
              <p className="text-sm text-gray-600">Send invoices via WhatsApp, email, or PDF. Track payments.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Users Are Saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 italic mb-4">&quot;Finally an invoicing app that speaks my language. The ZAR support and WhatsApp sharing is exactly what I needed.&quot;</p>
              <p className="font-medium text-gray-900">Thabo M.</p>
              <p className="text-xs text-gray-500">Freelance Designer, Johannesburg</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 italic mb-4">&quot;Simple, clean, and gets the job done. I switched from spreadsheets to this and never looked back.&quot;</p>
              <p className="font-medium text-gray-900">Sarah K.</p>
              <p className="text-xs text-gray-500">Small Business Owner, Cape Town</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 italic mb-4">&quot;The multi-language feature is a game changer. I can send invoices in Afrikaans to my clients.&quot;</p>
              <p className="font-medium text-gray-900">Pieter v.</p>
              <p className="text-xs text-gray-500">Contractor, Pretoria</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-6">Join thousands of South African businesses invoicing smarter.</p>
          {!session && (
            <Link href="/register" className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-block">
              Create Free Account
            </Link>
          )}
        </div>
      </section>

      <footer className="bg-gray-900 border-t border-gray-800 py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <p>&copy; 2026 GOGO Invoice</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-gray-300">Sign In</Link>
            <Link href="/pricing" className="hover:text-gray-300">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
