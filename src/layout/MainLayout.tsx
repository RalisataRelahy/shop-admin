import { Outlet } from 'react-router-dom';
import SideBar from './components/SideBar';
import './MainLayout.css';

export default function MainLayout() {
    return (
        <div className="layout-container">
            {/* Barre latérale fixe */}
            <SideBar />
            
            {/* Zone de contenu principal qui change selon la route */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
