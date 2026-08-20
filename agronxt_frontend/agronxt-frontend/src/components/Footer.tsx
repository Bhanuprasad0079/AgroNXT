import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#f7faf8] dark:bg-[#181c1b] border-t border-[#bfc9bc]/20 py-12 px-8 transition-colors duration-300 z-10 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <span className="font-headline font-bold text-[#146b34] dark:text-[#86d995] text-xl block mb-2">AgroNXT</span>
          <p className="text-[#707a6f] dark:text-[#bfc9bc] font-body text-sm tracking-wide">
            © {new Date().getFullYear()} AgroNXT. Precision for the Modern Cultivator.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8">
          <Link href="/privacy" className="text-[#707a6f] dark:text-[#bfc9bc] uppercase text-[0.75rem] tracking-[0.05em] font-bold hover:text-[#005123] dark:hover:text-[#86d995] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-[#707a6f] dark:text-[#bfc9bc] uppercase text-[0.75rem] tracking-[0.05em] font-bold hover:text-[#005123] dark:hover:text-[#86d995] transition-colors">
            Terms of Service
          </Link>
          <Link href="/sustainability" className="text-[#707a6f] dark:text-[#bfc9bc] uppercase text-[0.75rem] tracking-[0.05em] font-bold hover:text-[#005123] dark:hover:text-[#86d995] transition-colors">
            Sustainability Report
          </Link>
          <Link href="/contact" className="text-[#707a6f] dark:text-[#bfc9bc] uppercase text-[0.75rem] tracking-[0.05em] font-bold hover:text-[#005123] dark:hover:text-[#86d995] transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}