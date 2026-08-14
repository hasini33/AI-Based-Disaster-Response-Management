function Navbar()
{
    return (
        <nav className="h-16 bg-white shadow-md flex items-center justify-between px-6">
            <h1 className="text-x1 font-bold">
                Disaster Response System
            </h1>
            <div className="flex items-center gap-6">
                <span>Alerts</span>
                <span>Admin</span>
                <span>Settings</span>
            </div>
        </nav>
    )
}
export default Navbar