import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiMapPin, FiPhone, FiMail, FiArrowUpRight } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { businessInfo, storeHours, socialLinks } = useSelector(
    (state) => state.site,
  );

  const safeBusinessInfo = businessInfo || {};
  const safeStoreHours = storeHours || {};
  const safeSocialLinks = socialLinks || {};
  const safeStoreName = safeBusinessInfo.storeName || "Hindumatha's Cake World";
  const safePhone = String(safeBusinessInfo.phone || "").trim();
  const safeEmail = String(safeBusinessInfo.email || "").trim();
  const phoneHref = safePhone ? `tel:${safePhone.replace(/\s+/g, "")}` : "#";
  const emailHref = safeEmail ? `mailto:${safeEmail}` : "#";

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Menu", path: "/menu" },
    { name: "Gallery", path: "/gallery" },
    { name: "Contact", path: "/contact" },
    { name: "My Orders", path: "/orders" },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-shell">
        <div className="site-footer-main">
          <div className="site-footer-grid">
            <div>
              <div className="site-footer-brand">
                <div className="site-footer-badge">H</div>
                <p className="site-footer-brand-name">{safeStoreName}</p>
              </div>
              <p className="site-footer-intro">
                {safeBusinessInfo.intro ||
                  "Crafting unforgettable cakes for every celebration."}
              </p>
              <div className="site-footer-socials">
                <a
                  href={safeSocialLinks.facebook || "#"}
                  className="site-footer-social-link"
                  aria-label="Facebook"
                >
                  <FaFacebookF className="h-4 w-4" />
                </a>
                <a
                  href={safeSocialLinks.instagram || "#"}
                  className="site-footer-social-link"
                  aria-label="Instagram"
                >
                  <FaInstagram className="h-4 w-4" />
                </a>
                <a
                  href={safeSocialLinks.whatsapp || "#"}
                  className="site-footer-social-link"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="site-footer-heading">Quick Links</h4>
              <ul className="site-footer-list">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="site-footer-nav-link group">
                      {link.name}
                      <FiArrowUpRight className="h-3.5 w-3.5 opacity-0 admin-motion group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="site-footer-heading">Contact</h4>
              <ul className="site-footer-contact-list">
                <li className="site-footer-contact-item">
                  <FiMapPin className="site-footer-contact-icon" />
                  <span className="whitespace-pre-line">
                    {safeBusinessInfo.address || "Vizianagaram, Andhra Pradesh"}
                  </span>
                </li>
                <li className="site-footer-contact-item">
                  <FiPhone className="site-footer-contact-icon" />
                  <a href={phoneHref} className="site-footer-contact-link">
                    {safePhone || "Contact unavailable"}
                  </a>
                </li>
                <li className="site-footer-contact-item">
                  <FiMail className="site-footer-contact-icon" />
                  <a href={emailHref} className="site-footer-contact-link">
                    {safeEmail || "Email unavailable"}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="site-footer-heading">Business Hours</h4>
              <ul className="site-footer-hours">
                <li className="site-footer-hours-row">
                  <span className="site-footer-hours-label">Weekdays</span>
                  <span className="site-footer-hours-value">
                    {safeStoreHours.weekdays || "8:00 AM - 9:00 PM"}
                  </span>
                </li>
                <li className="site-footer-hours-row">
                  <span className="site-footer-hours-label">Weekends</span>
                  <span className="site-footer-hours-value">
                    {safeStoreHours.weekends || "9:00 AM - 10:00 PM"}
                  </span>
                </li>
              </ul>
              <p className="site-footer-note">
                <strong>Note:</strong> We accept orders 24/7 through our website
                and WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <div className="site-footer-shell">
          <div className="site-footer-bottom-row">
            <p className="site-footer-link">
              © {currentYear} {safeStoreName}. All rights reserved.
            </p>
            <div className="site-footer-sub-links">
              <a href="#" className="site-footer-link">
                Privacy Policy
              </a>
              <a href="#" className="site-footer-link">
                Terms of Service
              </a>
              <a href="#" className="site-footer-link">
                Refund Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
