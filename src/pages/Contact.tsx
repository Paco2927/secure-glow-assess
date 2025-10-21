import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import techSecureIcon from "@/assets/techsecure_ai.png";

const contactSchema = z.object({
  fullName: z.string().trim().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  email: z.string().trim().email("Correo electrónico inválido").max(255, "Máximo 255 caracteres"),
  phone: z.string().trim().max(50, "Máximo 50 caracteres").optional(),
  companyName: z.string().trim().min(1, "El nombre de la empresa es requerido").max(200, "Máximo 200 caracteres"),
  message: z.string().trim().min(1, "El mensaje es requerido").max(2000, "Máximo 2000 caracteres"),
});

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contactSettings, setContactSettings] = useState({
    email: "tester7531yt@gmail.com",
    phone: "+(506) 62979402",
    location: "San José, Costa Rica",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchContactSettings();
  }, []);

  const fetchContactSettings = async () => {
    const { data, error } = await supabase.from("contact_settings").select("*").limit(1).single();

    if (data && !error) {
      setContactSettings({
        email: data.destination_email,
        phone: data.company_phone || "+(506) 62979402",
        location: data.company_location || "San José, Costa Rica",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validated = contactSchema.parse(formData);

      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: validated,
      });

      if (error) throw error;

      toast({
        title: "¡Mensaje enviado!",
        description: "Nos pondremos en contacto contigo pronto.",
      });

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        companyName: "",
        message: "",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar el mensaje. Por favor intenta de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
              <img src={techSecureIcon} alt="TechSecureIA" className="w-4.5 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">TechSecureIA</h1>
              <p className="text-xs text-muted-foreground">Cybersecurity Assessment Platform</p>
            </div>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Contáctenos - <span className="text-primary">TechSecure AI</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                ¿Listo para fortalecer su postura de ciberseguridad? Nuestros expertos están aquí para ayudarle a
                implementar soluciones de seguridad impulsadas por IA.
              </p>
            </div>

            {/* Contact Info Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Envíenos un correo</h3>
                  <p className="text-muted-foreground text-sm break-all">{contactSettings.email}</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-7 h-7 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2">Llámenos</h3>
                  <p className="text-muted-foreground text-sm">{contactSettings.phone}</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Visítenos</h3>
                  <p className="text-muted-foreground text-sm">{contactSettings.location}</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="shadow-medium">
              <CardContent className="pt-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName">
                        Nombre Completo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Ingresar Nombre"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={errors.fullName ? "border-destructive" : ""}
                      />
                      {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">
                        Correo Electrónico <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="TuEmpresa@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="companyName">
                        Nombre de la Empresa <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Su Empresa S.A."
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className={errors.companyName ? "border-destructive" : ""}
                      />
                      {errors.companyName && <p className="text-sm text-destructive mt-1">{errors.companyName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone">Número de Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Ingresar número telefónico"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">
                      Mensaje <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Cuéntenos sobre sus necesidades y desafíos de ciberseguridad..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                  </div>

                  <Button type="submit" size="lg" className="w-full shadow-medium" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Mensaje"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">© 2025 TechSecureIA. Plataforma profesional de evaluación de ciberseguridad.</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
