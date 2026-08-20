import App from './App'
import { SEO } from './components/SEO'
import { useAuth } from './context/AuthContext'
import { LandingPage } from './public-pages/LandingPage'
import { FeaturesPage } from './public-pages/FeaturesPage'
import { PricingPage } from './public-pages/PricingPage'
import { BlogArticlePage, BlogIndexPage } from './public-pages/BlogPages'
import { AboutPage, ContactPage, PrivacyPage, TermsPage } from './public-pages/InfoPages'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage } from './public-pages/AuthPages'
import { PublicLayout } from './public-pages/PublicLayout'

export default function Root(){
  const path=window.location.pathname.replace(/\/+$/,'') || '/'
  if(path==='/') return <LandingPage/>
  if(path==='/features') return <FeaturesPage/>
  if(path==='/pricing') return <PricingPage/>
  if(path==='/blog') return <BlogIndexPage/>
  if(path.startsWith('/blog/')) return <BlogArticlePage slug={decodeURIComponent(path.slice('/blog/'.length))}/>
  if(path==='/about') return <AboutPage/>
  if(path==='/contact') return <ContactPage/>
  if(path==='/privacy') return <PrivacyPage/>
  if(path==='/terms') return <TermsPage/>
  if(path==='/login') return <LoginPage/>
  if(path==='/signup') return <SignupPage/>
  if(path==='/forgot-password') return <ForgotPasswordPage/>
  if(path==='/reset-password') return <ResetPasswordPage/>
  if(path==='/app') return <AppGate/>
  return <PublicLayout><SEO title="Page Not Found | MoneyCove" description="The requested MoneyCove page could not be found." path={path} robots="noindex,nofollow"/><main className="mx-auto max-w-3xl px-4 py-24 text-center"><div className="eyebrow">404</div><h1 className="mt-3 text-5xl font-black tracking-[-.05em]">This page doesn’t exist.</h1><p className="mt-4 text-sm font-medium text-slate-500">Return to MoneyCove and keep moving.</p><a href="/" className="primary-btn mt-7">Go home</a></main></PublicLayout>
}

function AppGate(){
  const {configured}=useAuth()
  return <><SEO title="MoneyCove App" description="Your MoneyCove finance workspace." path="/app" robots="noindex,nofollow"/>{configured?<App/>:<main className="grid min-h-dvh place-items-center bg-slate-950 px-4 text-white"><div className="max-w-lg rounded-[28px] border border-white/10 bg-white/5 p-7"><div className="text-xs font-black uppercase tracking-[.18em] text-teal-300">Setup required</div><h1 className="mt-3 text-3xl font-black">Connect Supabase first.</h1><p className="mt-3 text-sm font-medium leading-6 text-slate-300">Add VITE_SUPABASE_URL and a Supabase publishable key to this deployment, run the included Supabase SQL, then redeploy.</p></div></main>}</>
}
