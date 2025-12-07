// PART 1: IMPORTS AND DATA CONSTANTS
// Copy this section first

import { ShoppingBag, Menu, ChevronRight, Star, Truck, Shield, Heart, Baby, Shirt, Bed, Sparkles, MapPin, Phone, Mail, Clock, Package, Award, Users, TrendingUp, Gift} from 'lucide-react';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AuthButton } from '@/components/auth-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function LuxeCollections() {
  const categories = [
    {
      id: "african-fashion",
      title: "African Fashion",
      description: "Authentic Kitenge & African prints",
      image: "https://images.unsplash.com/photo-1623693082369-24afc340e3ae?w=800&h=1000&fit=crop",
      icon: <Shirt className="w-6 h-6" />,
      badge: "Trending"
    },
    {
      id: "baby-shop",
      title: "Baby Essentials",
      description: "Everything for your little one",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=1000&fit=crop",
      icon: <Baby className="w-6 h-6" />,
      badge: "New"
    },
    {
      id: "bedding",
      title: "Luxury Bedding",
      description: "Premium comfort for better sleep",
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=1000&fit=crop",
      icon: <Bed className="w-6 h-6" />,
      badge: "Popular"
    },
    {
      id: "perfumes",
      title: "Refillable Perfumes",
      description: "Premium fragrances, eco-friendly",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=1000&fit=crop",
      icon: <Sparkles className="w-6 h-6" />,
      badge: "Exclusive"
    }
  ];

  const africanFashion = [
    {
      title: "Women's Kitenge Dresses",
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=1000&fit=crop",
      price: "From KES 1,800",
      description: "Vibrant patterns and modern cuts"
    },
    {
      title: "Men's Ankara Shirts",
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop",
      price: "From KES 2,200",
      description: "Bold prints, comfortable fit"
    },
    {
      title: "Kids African Outfits",
      image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&h=1000&fit=crop",
      price: "From KES 1,200",
      description: "Adorable prints for little ones"
    },
    {
      title: "Traditional Kanga Sets",
      image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&h=1000&fit=crop",
      price: "From KES 1,500",
      description: "Authentic East African style"
    }
  ];

  const babyProducts = [
    {
      title: "Baby Clothing Sets",
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=1000&fit=crop",
      price: "From KES 800",
      description: "Soft, gentle fabrics"
    },
    {
      title: "Nursery Essentials",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=1000&fit=crop",
      price: "From KES 1,500",
      description: "Complete nursery setup"
    },
    {
      title: "Baby Care Products",
      image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=1000&fit=crop",
      price: "From KES 500",
      description: "Safe & gentle skincare"
    },
    {
      title: "Toys & Accessories",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=1000&fit=crop",
      price: "From KES 600",
      description: "Educational & fun"
    }
  ];

  const beddingCollection = [
    {
      title: "Egyptian Cotton Sheets",
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=1000&fit=crop",
      price: "From KES 4,500",
      description: "Premium 800 thread count"
    },
    {
      title: "Luxury Duvet Sets",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=1000&fit=crop",
      price: "From KES 5,500",
      description: "Hotel-quality comfort"
    },
    {
      title: "Decorative Pillows",
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=1000&fit=crop",
      price: "From KES 1,200",
      description: "Stylish home accents"
    },
    {
      title: "Premium Bed Covers",
      image: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&h=1000&fit=crop",
      price: "From KES 3,800",
      description: "Elegant designs"
    }
  ];

  const perfumeCollection = [
    {
      title: "Signature Collection",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=1000&fit=crop",
      price: "From KES 1,500",
      description: "Designer fragrances"
    },
    {
      title: "Floral & Fresh",
      image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=1000&fit=crop",
      price: "From KES 1,200",
      description: "Light & refreshing"
    },
    {
      title: "Oriental & Woody",
      image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59ff9?w=800&h=1000&fit=crop",
      price: "From KES 1,800",
      description: "Rich & sophisticated"
    },
    {
      title: "Unisex Classics",
      image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&h=1000&fit=crop",
      price: "From KES 1,600",
      description: "Timeless scents"
    }
  ];

  const clothingCategories = [
    {
      title: "Women's Clothing",
      items: "Dresses, Tops, Skirts & More",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=800&fit=crop",
      price: "From KES 1,500"
    },
    {
      title: "Men's Clothing",
      items: "Shirts, Trousers, Suits & More",
      image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600&h=800&fit=crop",
      price: "From KES 2,000"
    },
    {
      title: "Kids Fashion",
      items: "Trendy outfits for boys & girls",
      image: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&h=800&fit=crop",
      price: "From KES 800"
    }
  ];

  const testimonials = [
    {
      name: "Amina Mwangi",
      location: "Nairobi",
      text: "The kitenge dresses are absolutely stunning! Quality is top-notch and delivery was fast within Nairobi. I've ordered three times already!",
      rating: 5
    },
    {
      name: "John Kamau",
      location: "Mombasa",
      text: "Bought baby essentials and bedding for my newborn. Everything arrived in perfect condition. The customer service team was very helpful!",
      rating: 5
    },
    {
      name: "Grace Otieno",
      location: "Kisumu",
      text: "Love the refillable perfumes! Eco-friendly and affordable. The African print collection is my favorite. Will definitely shop again.",
      rating: 5
    },
    {
      name: "David Omondi",
      location: "Nakuru",
      text: "Best place to shop for quality bedding in Kenya. The Egyptian cotton sheets are worth every shilling. Highly recommend!",
      rating: 5
    },
    {
      name: "Sarah Wanjiku",
      location: "Eldoret",
      text: "Amazing selection of African fashion. I bought outfits for my whole family. The kids' section is fantastic too!",
      rating: 5
    },
    {
      name: "Michael Ngugi",
      location: "Thika",
      text: "Professional service and authentic products. The perfume refills save me so much money. Five stars all the way!",
      rating: 5
    }
  ];

  const features = [
    {
      icon: <Truck className="w-7 h-7" />,
      title: "Nairobi Delivery",
      desc: "Same-day delivery within Nairobi CBD"
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: "M-Pesa & Cards",
      desc: "Secure payment options"
    },
    {
      icon: <Heart className="w-7 h-7" />,
      title: "Quality Guarantee",
      desc: "100% authentic products"
    },
    {
      icon: <MapPin className="w-7 h-7" />,
      title: "Kenya-wide Shipping",
      desc: "We deliver across all counties"
    }
  ];

  const whyChooseUs = [
    {
      icon: <Award className="w-8 h-8" />,
      title: "Premium Quality",
      description: "Every product is carefully selected and quality-checked before shipping"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "10,000+ Happy Customers",
      description: "Join thousands of satisfied customers across Kenya"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Fast Delivery",
      description: "Same-day delivery in Nairobi, 2-5 days countrywide"
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Easy Returns",
      description: "7-day return policy for your peace of mind"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Latest Trends",
      description: "Stay ahead with our constantly updated collections"
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Gift Wrapping",
      description: "Free gift wrapping on all orders over KES 3,000"
    }
  ];

  // PART 2: JSX RETURN - NAVIGATION TO FEATURES
  // Copy this after Part 1, starting from the return statement

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/95 backdrop-blur-md border-b animate-slideDown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:rotate-12" />
              <span className="text-lg sm:text-2xl font-light tracking-wider">
                LUXE <span className="font-semibold">COLLECTIONS</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-6">
              <a href="#african-fashion" className="text-sm tracking-wide transition-all duration-300 hover:opacity-70">
                African Fashion
              </a>
              <a href="#baby-shop" className="text-sm tracking-wide transition-all duration-300 hover:opacity-70">
                Baby Shop
              </a>
              <a href="#clothing" className="text-sm tracking-wide transition-all duration-300 hover:opacity-70">
                Clothing
              </a>
              <a href="#bedding" className="text-sm tracking-wide transition-all duration-300 hover:opacity-70">
                Bedding
              </a>
              <a href="#perfumes" className="text-sm tracking-wide transition-all duration-300 hover:opacity-70">
                Perfumes
              </a>
              <a href="#testimonials" className="text-sm tracking-wide transition-all duration-300 hover:opacity-70">
                Reviews
              </a>
              <Suspense fallback={<div className="w-20 h-10" />}>
                <AuthButton />
              </Suspense>
            </div>

            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-amber-800 to-yellow-900">
          <Image
            src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1920&h=1080&fit=crop"
            alt="African fashion and lifestyle"
            fill
            className="object-cover opacity-30 animate-slowZoom"
            priority
            sizes="100vw"
          />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl animate-fadeIn">
          <Badge variant="secondary" className="mb-4 sm:mb-6 text-xs sm:text-sm">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Proudly Kenyan 🇰🇪
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-4 sm:mb-6 tracking-wider animate-slideUp">
            African <span className="font-semibold italic">Elegance</span> Meets Modern <span className="font-semibold italic">Style</span>
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 font-light animate-slideUp animation-delay-200 max-w-3xl mx-auto">
            From authentic Kitenge fashion to baby essentials, luxury bedding, and premium perfumes — all delivered across Kenya
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slideUp animation-delay-400">
            <Button size="lg" className="rounded-full px-6 sm:px-8 group hover:scale-105 transition-transform w-full sm:w-auto">
              Shop Now
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-6 sm:px-8 bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 w-full sm:w-auto">
              Browse Collections
            </Button>
          </div>
        </div>

        <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-scroll"></div>
          </div>
        </div>
      </section>

      {/* Shop Categories Overview */}
      <section className="py-12 sm:py-16 lg:py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 animate-fadeIn">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-4">
              Shop By <span className="font-semibold">Category</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Discover our diverse collection of quality products for every need
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {categories.map((category, i) => (
              <a href={`#${category.id}`} key={i}>
                <Card
                  className="group cursor-pointer overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fadeIn"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary/90 backdrop-blur">{category.badge}</Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        {category.icon}
                        <h3 className="text-lg sm:text-xl font-semibold">{category.title}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200">{category.description}</p>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="text-center border-none shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fadeIn bg-background/80 backdrop-blur"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 px-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary text-primary-foreground rounded-full mb-3 sm:mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PART 3: PRODUCT SECTIONS - African Fashion, Baby, Clothing, Bedding, Perfumes */}

      {/* African Fashion Section */}
      <section id="african-fashion" className="py-12 sm:py-16 lg:py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 animate-fadeIn">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <Shirt className="w-3 h-3 mr-1" />
              African Fashion
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-4">
              Authentic <span className="font-semibold">Kitenge & African Prints</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Celebrate African heritage with our vibrant collection of traditional and contemporary designs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {africanFashion.map((item, i) => (
              <Card
                key={i}
                className="group cursor-pointer overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4 sm:p-6">
                    <Button variant="secondary" className="rounded-full w-full text-sm sm:text-base">
                      Shop Now
                    </Button>
                  </div>
                </div>
                <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 px-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">{item.description}</p>
                  <p className="text-sm sm:text-base font-medium text-primary">{item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Baby Shop Section */}
      <section id="baby-shop" className="py-12 sm:py-16 lg:py-24 bg-secondary/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 animate-fadeIn">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <Baby className="w-3 h-3 mr-1" />
              Baby Shop
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-4">
              Everything for Your <span className="font-semibold">Little One</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Safe, gentle, and adorable products for babies from newborn to toddler
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {babyProducts.map((item, i) => (
              <Card
                key={i}
                className="group cursor-pointer overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4 sm:p-6">
                    <Button variant="secondary" className="rounded-full w-full text-sm sm:text-base">
                      Shop Now
                    </Button>
                  </div>
                </div>
                <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 px-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">{item.description}</p>
                  <p className="text-sm sm:text-base font-medium text-primary">{item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Clothing Section */}
      <section id="clothing" className="py-12 sm:py-16 lg:py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 animate-fadeIn">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              Fashion for All
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-4">
              <span className="font-semibold">Clothing</span> for Everyone
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Stylish and comfortable clothing for women, men, and kids
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {clothingCategories.map((item, i) => (
              <Card
                key={i}
                className="group cursor-pointer overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-200 mb-3">{item.items}</p>
                    <p className="text-base font-medium">{item.price}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bedding Section */}
      <section id="bedding" className="py-12 sm:py-16 lg:py-24 bg-secondary/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 animate-fadeIn">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <Bed className="w-3 h-3 mr-1" />
              Premium Bedding
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-4">
              Luxury <span className="font-semibold">Bedding & Linens</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Transform your bedroom into a sanctuary with our premium bedding collection
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {beddingCollection.map((item, i) => (
              <Card
                key={i}
                className="group cursor-pointer overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4 sm:p-6">
                    <Button variant="secondary" className="rounded-full w-full text-sm sm:text-base">
                      Shop Now
                    </Button>
                  </div>
                </div>
                <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 px-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">{item.description}</p>
                  <p className="text-sm sm:text-base font-medium text-primary">{item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Perfumes Section */}
      <section id="perfumes" className="py-12 sm:py-16 lg:py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 animate-fadeIn">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Refillable Perfumes
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-4">
              Premium <span className="font-semibold">Fragrances</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Designer scents at affordable prices with our eco-friendly refill system
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {perfumeCollection.map((item, i) => (
              <Card
                key={i}
                className="group cursor-pointer overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4 sm:p-6">
                    <Button variant="secondary" className="rounded-full w-full text-sm sm:text-base">
                      Shop Now
                    </Button>
                  </div>
                </div>
                <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 px-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">{item.description}</p>
                  <p className="text-sm sm:text-base font-medium text-primary">{item.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PART 4: FINAL SECTIONS - Why Choose Us, Testimonials, CTA, Footer */}

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16 animate-fadeIn">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-4">
              Why Choose <span className="font-semibold">Luxe Collections</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              We&apos;re committed to providing the best shopping experience in Kenya
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {whyChooseUs.map((item, i) => (
              <Card
                key={i}
                className="text-center border-none shadow-md hover:shadow-xl transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="pt-8 pb-8 px-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-12 sm:py-16 lg:py-24 bg-primary text-primary-foreground scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-4">
              What Our <span className="font-semibold">Customers Say</span>
            </h2>
            <p className="text-primary-foreground/80 text-base sm:text-lg">Trusted by families across Kenya</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((testimonial, i) => (
              <Card
                key={i}
                className="bg-primary-foreground/10 border-primary-foreground/20 backdrop-blur animate-fadeIn"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 px-4 sm:px-6">
                  <div className="flex justify-center mb-3 sm:mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base font-light mb-3 sm:mb-4 italic text-primary-foreground leading-relaxed">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <p className="text-primary-foreground font-semibold text-sm sm:text-base">{testimonial.name}</p>
                  <p className="text-primary-foreground/70 text-xs sm:text-sm flex items-center justify-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {testimonial.location}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-4 sm:mb-6">
            Ready to <span className="font-semibold">Shop?</span>
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-8">
            Join thousands of satisfied customers across Kenya who trust Luxe Collections for quality products and excellent service
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="rounded-full px-8 sm:px-10 hover:scale-105 transition-transform shadow-xl w-full sm:w-auto">
              Start Shopping Now
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 sm:px-10 w-full sm:w-auto">
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/20 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <ShoppingBag className="w-6 h-6" />
                <span className="text-xl sm:text-2xl font-light tracking-wider">
                  LUXE <span className="font-semibold">COLLECTIONS</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Kenya&apos;s premier destination for African fashion, baby essentials, bedding, and luxury perfumes.
              </p>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#african-fashion" className="text-muted-foreground hover:text-foreground transition-colors">African Fashion</a></li>
                <li><a href="#baby-shop" className="text-muted-foreground hover:text-foreground transition-colors">Baby Shop</a></li>
                <li><a href="#bedding" className="text-muted-foreground hover:text-foreground transition-colors">Bedding</a></li>
                <li><a href="#perfumes" className="text-muted-foreground hover:text-foreground transition-colors">Perfumes</a></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Shipping Info</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Returns Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Size Guide</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQs</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>Nairobi, Kenya</span>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>+254 XXX XXX XXX</span>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>info@luxecollections.ke</span>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2024 Luxe Collections Kenya. All rights reserved.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookies</a>
              </div>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
