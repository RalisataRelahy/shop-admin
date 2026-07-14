import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import './SideBar.css';
import { LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../../supabase/config';
import LogoImage from '../../assets/shop_logo.png';

const listBtn = [
    { name: "Dashboard", path: "/" },
    { name: "Gestion Commandes", path: "/commandes" },
    { name: "Gestion Catégories-plats", path: "/categories" },
    { name: "Gestion Menu", path: "/menu" },
    { name: "Gestion Clients", path: "/clients" }
];

export default function SideBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activePath, setActivePath] = useState(listBtn[0].path);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const matchedBtn = listBtn.find((btn) =>
            btn.path === "/"
                ? location.pathname === "/"
                : location.pathname === btn.path || location.pathname.startsWith(`${btn.path}/`)
        );

        setActivePath(matchedBtn?.path ?? listBtn[0].path);
    }, [location.pathname]);

    // Ferme le drawer à chaque changement de page
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Bloque le scroll du body quand le drawer est ouvert
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const logout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    return (
        <>
            <button
                className="burger-btn"
                onClick={() => setIsOpen(true)}
                aria-label="Ouvrir le menu"
            >
                <Menu size={22} />
            </button>

            {isOpen && (
                <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
            )}

            <div className={`sidebar-content ${isOpen ? 'sidebar-open' : ''}`}>
                <div className="logo">
                    <img src={LogoImage} alt="shop+ logo" />
                    <p className='title'>Administrator</p>
                    <button
                        className="close-btn"
                        onClick={() => setIsOpen(false)}
                        aria-label="Fermer le menu"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="sidebar-list-content">
                    <div className="sidebar-list">
                        {listBtn.map((btn) => (
                            <NavLink
                                key={btn.path}
                                to={btn.path}
                                className={`btn ${activePath === btn.path ? 'active' : ''}`}
                            >
                                {btn.name}
                            </NavLink>
                        ))}
                        <button className="logout-btn" onClick={() => logout()}>
                            Se déconnecter
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}