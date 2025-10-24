import { Shield } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full gradient-hero flex items-center justify-center animate-pulse">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">TechSecureIA</h2>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
