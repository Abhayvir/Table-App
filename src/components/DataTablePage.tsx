import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DataTable, DataTableSelectionChangeEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber, InputNumberChangeEvent } from 'primereact/inputnumber';
import { Button } from 'primereact/button';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';

interface ArtworkItem {
  id: string;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string | null;
  date_start: number;
  date_end: number;
}

interface APIResponse {
  data: ArtworkItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

const BASE_API_URL = 'https://api.artic.edu/api/v1/artworks';
const FIELDS = 'id,title,place_of_origin,artist_display,inscriptions,date_start,date_end';
const ROWS_PER_PAGE = 12;

const DataTablePage: React.FC = () => {
  const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArtworks, setSelectedArtworks] = useState<ArtworkItem[]>([]);
  const [customRowCount, setCustomRowCount] = useState<number | null>(null);
  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const API_URL = `${BASE_API_URL}?limit=100&fields=${FIELDS}`; 
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result: APIResponse = await response.json();
        setArtworks(result.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const selectRows = (count: number) => {
    setSelectedArtworks(artworks.slice(0, count));
  };

  const formatDate = (date: number): string => {
    return date ? date.toString() : 'N/A';
  };

  const handleCustomRowCountChange = (e: InputNumberChangeEvent) => {
    setCustomRowCount(e.value !== null ? e.value : null);
  };

  const headerTemplate = useMemo(() => {
    return (
      <div className="flex align-items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="cursor-pointer ml-2"
          onClick={(e) => op.current?.toggle(e)}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <OverlayPanel ref={op} appendTo={typeof window !== 'undefined' ? document.body : null} showCloseIcon>
          <div className="p-2">
            <InputNumber 
              value={customRowCount} 
              onValueChange={handleCustomRowCountChange}
              placeholder="Enter number of rows"
              min={0}
              max={artworks.length}
              className="mb-2"
            />
            <Button 
              label="Select" 
              className="p-button-sm" 
              onClick={() => {
                if (customRowCount !== null) {
                  selectRows(customRowCount);
                }
                op.current?.hide();
              }} 
            />
          </div>
        </OverlayPanel>
      </div>
    );
  }, [customRowCount, artworks.length]);

  const handleSelectionChange = (e: DataTableSelectionChangeEvent<ArtworkItem[]>) => {
    setSelectedArtworks(e.value);
  };

  return (
    <div className="m-4 p-4">
      <DataTable 
        value={artworks} 
        paginator 
        rows={ROWS_PER_PAGE}
        loading={loading} 
        responsiveLayout="scroll"
        selection={selectedArtworks}
        onSelectionChange={handleSelectionChange}
      >
        <Column selectionMode="multiple" headerStyle={{width: '3em'}} header={headerTemplate}></Column>
        <Column field="title" header="Title" sortable></Column>
        <Column field="place_of_origin" header="Place of Origin" sortable></Column>
        <Column field="artist_display" header="Artist" sortable></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Date Start" body={(rowData) => formatDate(rowData.date_start)} sortable></Column>
        <Column field="date_end" header="Date End" body={(rowData) => formatDate(rowData.date_end)} sortable></Column>
      </DataTable>
    </div>
  );
};

export default DataTablePage;