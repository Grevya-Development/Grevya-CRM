import React from "react";

const QuatationLanding = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 pt-5 pl-5">
                <button className="px-3 py-1 border rounded bg-[#00B8DC] text-white">
                    Import File
                </button>
                <button className="px-3 py-1 border rounded bg-gray-500 text-white">
                    Cancel
                </button>
            </div>
            <hr className="w-full px-6 border-gray-300 mx-auto" />
            <div className="flex flex-col items-center text-center gap-2 pt-20">
                <img
                    src="/uploadfile.png"
                    alt="Upload File"
                    className="w-24 h-24 object-contain"
                />
                <h2 className="text-lg font-semibold">
                    Upload an Excel or CSV file to import
                </h2>
                <p className="text-sm text-gray-500">
                    Accepted file types: .xlsx, .xls, .csv
                </p>
            </div>
        </div>
    );
};

export default QuatationLanding;
