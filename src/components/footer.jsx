const Footer = () => (
    <footer className="bg-gray-800 text-gray-200 py-6 mt-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/logo192.png" alt="" className="w-8 h-8" />
          <span className="font-bold text-lg">EMERGENCY ADMIN</span>
        </div>
        <div className="mt-3 md:mt-0 text-sm">
          &copy; {new Date().getFullYear()} ພັດທະນາໂດຍນັກສຶກສາມະຫາວິທະຍາໄລສຸພານຸວົງ
        </div>
      </div>
    </footer>
  );
  
  export default Footer;
  