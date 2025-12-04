import { ShoppingBag, Menu, ChevronRight, Star, Truck, Shield, Heart } from 'lucide-react';
import { Suspense } from 'react';
import Image from 'next/image';
import { AuthButton } from '@/components/auth-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LuxeCollections() {
  const collections = [
    {
      title: "Summer Elegance",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop",
      price: "From $299"
    },
    {
      title: "Urban Chic",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1000&fit=crop",
      price: "From $349"
    },
    {
      title: "Evening Luxe",
      image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop",
      price: "From $499"
    }
  ];

  const testimonials = [
    { name: "Sarah Mitchell", text: "Absolutely stunning pieces. The quality exceeds expectations every time.", rating: 5 },
    { name: "Emily Chen", text: "Luxe Collections has become my go-to for elegant, timeless fashion.", rating: 5 },
    { name: "Jessica Brown", text: "The attention to detail and craftsmanship is unmatched. Highly recommend!", rating: 5 }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/95 backdrop-blur-md border-b animate-slideDown">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 group cursor-pointer">
            <ShoppingBag className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-2xl font-light tracking-wider">
              LUXE <span className="font-semibold">COLLECTIONS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {['Collections', 'New Arrivals', 'About', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm tracking-wide transition-all duration-300 hover:opacity-70">
                {item}
              </a>
            ))}
            <Suspense fallback={<div className="w-20 h-10" />}>
              <AuthButton />
            </Suspense>
            
          </div>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <Image
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=1080&fit=crop"
            alt="Fashion hero"
            fill
            className="object-cover opacity-40 animate-slowZoom"
            priority
            sizes="100vw"
          />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl animate-fadeIn">
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 tracking-wider animate-slideUp">
            Timeless <span className="font-semibold italic">Elegance</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 font-light animate-slideUp animation-delay-200">
            Curated collections for the modern sophisticate
          </p>
          <Button size="lg" className="animate-slideUp animation-delay-400 rounded-full px-8 group hover:scale-105 transition-transform">
            Explore Collections
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-scroll"></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[
            { icon: <Truck className="w-8 h-8" />, title: "Free Shipping", desc: "On orders over $200" },
            { icon: <Shield className="w-8 h-8" />, title: "Secure Payment", desc: "100% protected transactions" },
            { icon: <Heart className="w-8 h-8" />, title: "Handpicked Quality", desc: "Every piece carefully selected" }
          ].map((feature, i) => (
            <Card key={i} className="text-center border-none shadow-lg hover:scale-105 transition-transform duration-300 animate-fadeIn" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="pt-8 pb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mb-4 group-hover:rotate-12 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section id="collections" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 animate-fadeIn">
            <Badge variant="outline" className="mb-4 text-sm">Featured</Badge>
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              Our <span className="font-semibold">Collections</span>
            </h2>
            <p className="text-muted-foreground text-lg">Discover our latest curated selections</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {collections.map((item, i) => (
              <Card key={i} className="group cursor-pointer overflow-hidden border-none shadow-xl hover:shadow-2xl transition-shadow animate-fadeIn" style={{ animationDelay: `${i * 200}ms` }}>
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <Button variant="secondary" className="rounded-full w-full">
                      View Collection
                    </Button>
                  </div>
                </div>
                <CardContent className="pt-4 pb-4">
                  <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              What Our <span className="font-semibold">Clients Say</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="bg-primary-foreground/10 border-primary-foreground/20 backdrop-blur text-center animate-fadeIn" style={{ animationDelay: `${i * 200}ms` }}>
                <CardContent className="pt-8 pb-8">
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-lg font-light mb-4 italic text-primary-foreground">&ldquo;{testimonial.text}&rdquo;</p>
                  <p className="text-primary-foreground/70 text-sm">— {testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-secondary/50 to-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Ready to Elevate Your <span className="font-semibold">Wardrobe?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">Join thousands of satisfied customers who trust Luxe Collections</p>
          <Button size="lg" className="rounded-full px-10 hover:scale-105 transition-transform shadow-xl">
            Start Shopping
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-2xl font-light tracking-wider">
                LUXE <span className="font-semibold">COLLECTIONS</span>
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex gap-6 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              </div>
              <ThemeSwitcher />
            </div>
          </div>

          <p className="text-center mt-6 text-sm text-muted-foreground">© 2024 Luxe Collections. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
