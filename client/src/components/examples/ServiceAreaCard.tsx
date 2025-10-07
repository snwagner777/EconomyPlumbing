import ServiceAreaCard from '../ServiceAreaCard';

export default function ServiceAreaCardExample() {
  return (
    <div className="p-8 max-w-lg">
      <ServiceAreaCard
        title="Austin Metro Area"
        address="701 Tillery St #12, Austin, TX 78702"
        phone="(512) 649-2811"
        cities={[
          "Austin",
          "Cedar Park",
          "Leander",
          "Round Rock",
          "Georgetown",
          "Pflugerville",
          "Liberty Hill",
          "Buda",
          "Kyle"
        ]}
      />
    </div>
  );
}
