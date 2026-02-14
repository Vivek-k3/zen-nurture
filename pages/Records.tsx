import React from 'react';

const Records: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-20 pt-6">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold text-espresso">Records & Files</h2>
                <div className="flex gap-2">
                     <button className="bg-white border border-muted/20 text-espresso px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-oat transition-colors">
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Doctor Export
                    </button>
                    <button className="bg-espresso text-oat px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-espresso/90 transition-colors">
                        <span className="material-symbols-outlined text-sm">upload</span> Upload
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {/* Search & Filter */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        <button className="px-4 py-1.5 rounded-full bg-espresso text-oat text-sm font-bold whitespace-nowrap">All</button>
                        <button className="px-4 py-1.5 rounded-full bg-white border border-muted/20 text-muted text-sm font-bold hover:text-espresso whitespace-nowrap">Prescriptions</button>
                        <button className="px-4 py-1.5 rounded-full bg-white border border-muted/20 text-muted text-sm font-bold hover:text-espresso whitespace-nowrap">Lab Reports</button>
                        <button className="px-4 py-1.5 rounded-full bg-white border border-muted/20 text-muted text-sm font-bold hover:text-espresso whitespace-nowrap">Vaccine Card</button>
                    </div>

                    {/* Files List */}
                    <div className="space-y-3">
                        <div className="bg-white p-4 rounded-2xl border border-muted/10 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-alert-red/10 flex items-center justify-center text-alert-red shrink-0">
                                <span className="material-symbols-outlined">description</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-espresso">Antibiotic Prescription.pdf</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold bg-alert-red/10 text-alert-red px-2 py-0.5 rounded">Rx</span>
                                    <span className="text-xs text-muted">Dr. Thompson • 12 Feb 2024</span>
                                </div>
                            </div>
                            <button className="text-muted hover:text-espresso"><span className="material-symbols-outlined">more_vert</span></button>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-muted/10 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-dusty-blue/10 flex items-center justify-center text-dusty-blue shrink-0">
                                <span className="material-symbols-outlined">image</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-espresso">Vaccine_Card_Page1.jpg</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold bg-sage/10 text-sage px-2 py-0.5 rounded">Vaccine</span>
                                    <span className="text-xs text-muted">Uploaded by Mom • 10 Jan 2024</span>
                                </div>
                            </div>
                            <button className="text-muted hover:text-espresso"><span className="material-symbols-outlined">more_vert</span></button>
                        </div>
                    </div>
                </div>

                {/* Categories / Storage */}
                <div className="space-y-6">
                    <div className="bg-oat rounded-[24px] p-6">
                        <h3 className="text-lg font-bold text-espresso mb-4">Storage</h3>
                        <div className="w-full bg-white/50 h-2 rounded-full mb-2 overflow-hidden">
                            <div className="bg-espresso h-full w-[15%] rounded-full"></div>
                        </div>
                        <p className="text-xs text-muted">120 MB of 5 GB used</p>
                    </div>
                    
                    <div className="bg-white rounded-[24px] p-6 border border-muted/10">
                        <h3 className="text-lg font-bold text-espresso mb-4">Doctor Pack</h3>
                        <p className="text-sm text-muted mb-4">Generate a summary PDF with selected records for your next visit.</p>
                        <div className="space-y-2 mb-4">
                            <label className="flex items-center gap-2 text-sm text-espresso">
                                <input type="checkbox" className="rounded text-sage focus:ring-sage" checked readOnly/> Last 7d Logs
                            </label>
                            <label className="flex items-center gap-2 text-sm text-espresso">
                                <input type="checkbox" className="rounded text-sage focus:ring-sage" checked readOnly/> Growth Chart
                            </label>
                            <label className="flex items-center gap-2 text-sm text-espresso">
                                <input type="checkbox" className="rounded text-sage focus:ring-sage" checked readOnly/> Active Meds
                            </label>
                        </div>
                        <button className="w-full bg-sage text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-sage/90 transition-colors">
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Records;