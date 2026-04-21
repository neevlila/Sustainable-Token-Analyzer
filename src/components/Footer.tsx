export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-background/50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex flex-col items-center gap-1.5">

          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-2"></div>

          <p className="text-sm text-muted-foreground/60 text-center">
            &copy; {new Date().getFullYear()} Sustainable Token Analyzer. Built with innovation & sustainability.
          </p>
          <p className="text-sm text-muted-foreground/60 text-center">
            Made By Mahek Chavda, Drashti Bambharoliya, Preksha Thakkar, Ohm Chauhan, Archit Pithadiya, Neev Lila.
          </p>
        </div>
      </div>
    </footer>
  );
}
