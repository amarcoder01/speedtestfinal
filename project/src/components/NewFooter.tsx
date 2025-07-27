import React from 'react';
import { Link } from 'react-router-dom';
import { Gauge, Shield, Mail, ExternalLink, Github, Twitter, Linkedin, Facebook, Heart } from 'lucide-react';

const NewFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-70"></div>
                <div className="relative">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="ml-2 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SpeedTest Pro
              </span>
            </div>
            <p className="text-sm text-gray-600 max-w-xs">
              Accurate internet speed testing with detailed metrics and analysis to help you understand your connection quality.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Features Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Features</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <Gauge className="w-4 h-4" />
                  Speed Test
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />
                  Test History
                </Link>
              </li>
              <li>
                <Link to="/network-guide" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />
                  Network Guide
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />
                  Blog
                </Link>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          
          {/* Company Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="pt-8 mt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">
            &copy; {currentYear} SpeedTest Pro. All rights reserved.
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <span className="flex items-center">
              Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> by SpeedTest Pro Team
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default NewFooter;