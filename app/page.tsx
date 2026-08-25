import PromoBar from "@/components/landing/PromoBar";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Ticker from "@/components/landing/Ticker";
import Stats from "@/components/landing/Stats";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Personalization from "@/components/landing/Personalization";
import MobileExperience from "@/components/landing/MobileExperience";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Audiences from "@/components/landing/Audiences";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <>
      <PromoBar />
      <Nav />
      <Hero />
      <Ticker />
      <Stats />
      <Features />
      <HowItWorks />
      <Personalization />
      <MobileExperience />
      <DashboardPreview />
      <Audiences />
      <Pricing />
      <FAQ />
      <FinalCta />
      <Footer />
    </>
  );
}
