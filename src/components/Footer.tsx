import { Activity, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About EHCF */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary">EHCF</span>
                <span className="text-[10px] text-muted-foreground leading-none">Ethical Healthcare for All</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Committed to providing affordable, accessible, and quality healthcare services to everyone.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📞 1800-123-4567</p>
              <p>✉️ support@ehcf.org</p>
              <p>📍 Hyderabad, Telangana, India</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/tests" className="text-muted-foreground hover:text-primary transition-smooth">
                  All Tests
                </a>
              </li>
              <li>
                <a href="/packages" className="text-muted-foreground hover:text-primary transition-smooth">
                  Health Packages
                </a>
              </li>
              <li>
                <a href="/track" className="text-muted-foreground hover:text-primary transition-smooth">
                  Track Booking
                </a>
              </li>
              <li>
                <a href="/faqs" className="text-muted-foreground hover:text-primary transition-smooth">
                  FAQs
                </a>
              </li>
              <li>
                <a href="/terms" className="text-muted-foreground hover:text-primary transition-smooth">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-muted-foreground hover:text-primary transition-smooth">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Popular Tests */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Popular Tests</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/tests/cbc" className="text-muted-foreground hover:text-primary transition-smooth">
                  Complete Blood Count (CBC)
                </a>
              </li>
              <li>
                <a href="/tests/thyroid" className="text-muted-foreground hover:text-primary transition-smooth">
                  Thyroid Profile
                </a>
              </li>
              <li>
                <a href="/tests/diabetes" className="text-muted-foreground hover:text-primary transition-smooth">
                  Diabetes Screening
                </a>
              </li>
              <li>
                <a href="/tests/lipid" className="text-muted-foreground hover:text-primary transition-smooth">
                  Lipid Profile
                </a>
              </li>
              <li>
                <a href="/tests/liver" className="text-muted-foreground hover:text-primary transition-smooth">
                  Liver Function Test
                </a>
              </li>
              <li>
                <a href="/tests/kidney" className="text-muted-foreground hover:text-primary transition-smooth">
                  Kidney Function Test
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Connect With Us</h3>
            <div className="flex gap-4 mb-6">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary-lighter flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary-lighter flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary-lighter flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary-lighter flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2 font-medium">Download Mobile App</p>
              <p className="text-xs">(Coming Soon)</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Copyright © 2025 Ethical Health Care Foundation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
