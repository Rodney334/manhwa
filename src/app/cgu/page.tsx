import Link from "next/link";

export const metadata = {
  title: "Conditions générales d'utilisation",
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-fond text-txt2">
      <div className="max-w-3xl mx-auto px-5 py-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-[17px] w-fit mb-10"
        >
          <i className="w-2 h-2 rounded-full bg-vert" />
          <b className="font-normal text-txt">
            Manhwa<span className="text-vert">List</span>
          </b>
        </Link>

        <h1 className="font-display text-[30px] font-normal text-txt">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="text-[12.5px] text-txt3 font-mono mt-2">
          Dernière mise à jour : 12 août 2026
        </p>

        <div className="mt-10 flex flex-col gap-8 text-[14px] leading-relaxed">
          <Section title="1. Objet">
            <p>
              Les présentes conditions générales d&apos;utilisation (les « CGU ») régissent
              l&apos;accès et l&apos;usage du service ManhwaList (le « Service »), accessible
              notamment à l&apos;adresse manhwa-peach.vercel.app, édité à titre personnel et non
              commercial.
            </p>
            <p>
              Toute création de compte ou utilisation du Service, même sans création de compte,
              implique l&apos;acceptation pleine et entière des présentes CGU. Si vous n&apos;en
              acceptez pas les termes, vous devez renoncer à utiliser le Service.
            </p>
          </Section>

          <Section title="2. Nature du service — ce que ManhwaList n'est pas">
            <p>
              ManhwaList est un <b className="text-txt2">outil personnel d&apos;organisation de
              lecture</b>. Il permet à un utilisateur de suivre sa progression sur des œuvres
              (manhwas, manhuas, webtoons), de noter, d&apos;annoter et de classer sa propre
              bibliothèque, et de consulter des informations bibliographiques (titre, auteurs,
              genres, synopsis, visuel de couverture, nombre de chapitres) au sujet de ces
              œuvres.
            </p>
            <p>
              <b className="text-txt2">
                ManhwaList n&apos;héberge, n&apos;édite, ne publie, ne distribue et ne met à
                disposition aucun chapitre, planche, texte intégral ou reproduction d&apos;une
                œuvre protégée.
              </b>{" "}
              Les informations bibliographiques affichées proviennent de services tiers
              (notamment les API publiques de MangaDex, AniList et MyAnimeList/Jikan) et sont
              reprises à titre strictement informatif, pour permettre à l&apos;utilisateur
              d&apos;organiser sa propre liste de lecture. ManhwaList ne garantit ni
              l&apos;exactitude, ni l&apos;exhaustivité, ni la disponibilité continue de ces
              informations, qui dépendent de tiers sur lesquels l&apos;éditeur n&apos;a aucun
              contrôle.
            </p>
            <p>
              Les liens éventuels vers des plateformes de lecture externes sont fournis à titre
              indicatif. ManhwaList n&apos;est ni responsable du contenu de ces plateformes, ni
              partie à la relation entre l&apos;utilisateur et celles-ci.
            </p>
          </Section>

          <Section title="3. Accès au service et compte utilisateur">
            <p>
              L&apos;utilisation de certaines fonctionnalités (bibliothèque personnelle, partage,
              notifications) nécessite la création d&apos;un compte. L&apos;utilisateur
              s&apos;engage à fournir des informations exactes lors de son inscription et à les
              maintenir à jour.
            </p>
            <p>
              Le Service est destiné à des personnes majeures, ou mineures disposant de
              l&apos;autorisation de leur représentant légal. Il n&apos;est pas destiné aux
              enfants de moins de 13 ans, quelle que soit une éventuelle autorisation.
            </p>
            <p>
              L&apos;utilisateur est seul responsable de la confidentialité de ses identifiants
              de connexion et de toute activité effectuée depuis son compte. Un seul compte est
              autorisé par personne, sauf autorisation contraire explicite de l&apos;éditeur.
            </p>
            <p>
              L&apos;éditeur se réserve le droit de suspendre ou de supprimer, sans préavis et
              sans indemnité, tout compte dont l&apos;usage contreviendrait aux présentes CGU, à
              la loi applicable, ou porterait atteinte au bon fonctionnement du Service ou aux
              droits de tiers.
            </p>
          </Section>

          <Section title="4. Contenu soumis par l'utilisateur">
            <p>
              L&apos;utilisateur peut être amené à soumettre des informations (proposition de
              fiche pour le catalogue, alias de titre, notes personnelles, signalement) au
              Service. Il garantit que ce contenu est exact de bonne foi, ne porte pas atteinte
              aux droits de tiers, n&apos;est ni trompeur, ni frauduleux, ni illicite.
            </p>
            <p>
              Toute proposition de fiche soumise au catalogue peut être approuvée, rejetée,
              modifiée, fusionnée avec une fiche existante ou supprimée, à la seule discrétion
              de l&apos;équipe de modération du Service, sans obligation de justification
              détaillée envers son auteur au-delà des motifs communiqués via l&apos;interface de
              modération.
            </p>
            <p>
              L&apos;utilisateur concède à ManhwaList une licence non exclusive, gratuite et
              mondiale d&apos;utilisation, de reproduction et d&apos;affichage du contenu qu&apos;il
              soumet au catalogue, dans la stricte mesure nécessaire au fonctionnement du
              Service. Les notes, scores et annotations strictement personnels d&apos;un
              utilisateur ne sont ni publiés ni partagés, sauf usage explicite par
              l&apos;utilisateur de la fonctionnalité de partage prévue à l&apos;article 5.
            </p>
          </Section>

          <Section title="5. Partage de bibliothèque">
            <p>
              L&apos;utilisateur peut générer un lien public permettant à un tiers de consulter
              tout ou partie de sa bibliothèque. L&apos;utilisateur reconnaît que toute personne
              disposant de ce lien peut accéder au contenu qu&apos;il a choisi d&apos;y inclure,
              tant que le lien n&apos;a pas été révoqué ou n&apos;a pas expiré. ManhwaList
              n&apos;est pas responsable de la diffusion ultérieure d&apos;un lien par
              l&apos;utilisateur ou par un tiers l&apos;ayant obtenu.
            </p>
          </Section>

          <Section title="6. Usages interdits">
            <p>Sans que cette liste soit exhaustive, il est strictement interdit de :</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1">
              <li>
                collecter, aspirer ou extraire automatiquement (scraping) tout ou partie du
                contenu ou des données du Service, par un moyen autre que les fonctionnalités
                prévues à cet effet ;
              </li>
              <li>
                contourner, désactiver ou tenter de contourner toute mesure de sécurité, de
                limitation de requêtes ou de contrôle d&apos;accès du Service ;
              </li>
              <li>
                utiliser le Service à des fins illégales, frauduleuses, ou pour porter atteinte
                aux droits d&apos;un tiers, y compris ses droits de propriété intellectuelle ;
              </li>
              <li>
                usurper l&apos;identité d&apos;un tiers, créer un compte au nom d&apos;autrui sans
                autorisation, ou fournir des informations d&apos;inscription mensongères ;
              </li>
              <li>
                soumettre au catalogue un contenu que l&apos;utilisateur sait faux, trompeur, ou
                porter volontairement atteinte à l&apos;intégrité du catalogue (doublons
                délibérés, vandalisme, alias abusifs) ;
              </li>
              <li>
                perturber le fonctionnement normal du Service, notamment par des requêtes
                automatisées excessives, une charge anormale, ou toute forme d&apos;attaque
                informatique ;
              </li>
              <li>
                exploiter le Service à des fins commerciales sans accord préalable écrit de
                l&apos;éditeur.
              </li>
            </ul>
            <p>
              Toute violation constatée peut entraîner, immédiatement et sans préavis, la
              suspension ou la suppression du compte concerné, sans préjudice de toute action
              judiciaire que l&apos;éditeur jugerait utile d&apos;engager.
            </p>
          </Section>

          <Section title="7. Propriété intellectuelle">
            <p>
              La structure du Service, son code, son design, sa charte graphique, sa marque et
              son logo sont la propriété exclusive de l&apos;éditeur de ManhwaList, sauf mention
              contraire, et sont protégés par le droit de la propriété intellectuelle. Toute
              reproduction, représentation, ou exploitation non autorisée, totale ou partielle,
              est strictement interdite.
            </p>
            <p>
              Les titres, visuels de couverture, synopsis, noms d&apos;auteurs et autres
              métadonnées relatives aux œuvres référencées demeurent la propriété de leurs
              ayants droit respectifs (auteurs, éditeurs, plateformes sources). Leur affichage
              sur ManhwaList l&apos;est à titre purement informatif et ne saurait constituer une
              cession, une licence, ou une autorisation d&apos;exploitation au bénéfice de
              l&apos;utilisateur, qui s&apos;interdit toute reproduction ou réutilisation de ces
              éléments en dehors du cadre d&apos;utilisation personnelle du Service.
            </p>
          </Section>

          <Section title="8. Disponibilité et responsabilité">
            <p>
              Le Service est fourni « en l&apos;état » et « selon disponibilité », sans garantie
              d&apos;aucune sorte, expresse ou implicite, quant à sa continuité, son exactitude,
              sa disponibilité ou son adéquation à un usage particulier.
            </p>
            <p>
              L&apos;éditeur ne saurait être tenu responsable, dans toute la mesure permise par
              le droit applicable :
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1">
              <li>
                d&apos;une interruption, indisponibilité, altération ou suppression, temporaire
                ou définitive, du Service ou de tout ou partie des données qu&apos;il contient ;
              </li>
              <li>
                de l&apos;indisponibilité, de la modification ou de la fermeture des sources
                externes (MangaDex, AniList, MyAnimeList/Jikan, ou toute autre plateforme
                utilisée) et de leurs conséquences sur le fonctionnement du Service ;
              </li>
              <li>
                de toute perte, corruption ou divulgation non autorisée de données résultant
                d&apos;un cas de force majeure, d&apos;une défaillance d&apos;un prestataire
                technique tiers (hébergement, stockage, messagerie), ou d&apos;un acte
                malveillant échappant à son contrôle raisonnable ;
              </li>
              <li>
                de tout dommage indirect résultant de l&apos;utilisation ou de
                l&apos;impossibilité d&apos;utiliser le Service.
              </li>
            </ul>
          </Section>

          <Section title="9. Données personnelles">
            <p>
              Le traitement des données personnelles des utilisateurs est régi par la
              réglementation béninoise applicable à la protection des données à caractère
              personnel. Pour toute question relative à ses données, l&apos;utilisateur peut
              contacter l&apos;éditeur via les moyens indiqués sur le Service.
            </p>
          </Section>

          <Section title="10. Modification des CGU">
            <p>
              L&apos;éditeur se réserve le droit de modifier les présentes CGU à tout moment. La
              version en vigueur est celle publiée sur cette page, dont la date de dernière mise
              à jour figure en en-tête. L&apos;utilisation continue du Service après modification
              vaut acceptation des CGU modifiées.
            </p>
          </Section>

          <Section title="11. Droit applicable et juridiction compétente">
            <p>
              Les présentes CGU sont soumises au droit béninois. Tout litige relatif à leur
              validité, leur interprétation ou leur exécution qui n&apos;aurait pu être résolu à
              l&apos;amiable sera soumis aux tribunaux compétents de la République du Bénin.
            </p>
          </Section>

          <Section title="12. Dispositions diverses">
            <p>
              Si l&apos;une des clauses des présentes CGU venait à être déclarée nulle ou
              inapplicable, les autres clauses conserveraient leur pleine validité. Le fait pour
              l&apos;éditeur de ne pas se prévaloir d&apos;un manquement à une clause des
              présentes ne saurait être interprété comme une renonciation à s&apos;en prévaloir
              ultérieurement.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[16px] font-medium text-txt">{title}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}