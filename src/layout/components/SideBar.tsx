import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import './SideBar.css';
import { LogOut } from 'lucide-react';
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

    useEffect(() => {
        const matchedBtn = listBtn.find((btn) =>
            btn.path === "/"
                ? location.pathname === "/"
                : location.pathname === btn.path || location.pathname.startsWith(`${btn.path}/`)
        );

        setActivePath(matchedBtn?.path ?? listBtn[0].path);
    }, [location.pathname]);

    const logout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    return (
        <div className="sidebar-content">
            <div className="logo">
                <img src={LogoImage} alt="shop+ logo" />
                <p className='title'>Administrator</p>
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
    );
}