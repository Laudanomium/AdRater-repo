using Constellation;
using Constellation.Package;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AdRaterPackage
{
    public class Program : PackageBase
    {
        List<string> brandsList = new List<string>();

        static void Main(string[] args)
        {
            PackageHost.Start<Program>(args);
        }

        [MessageCallback]
        public void sendRating(Grade g)
        {
            PackageHost.PushStateObject<Grade>(g.brand,  g);
            PackageHost.WriteInfo("A grade has been pushed");
        }


        [MessageCallback]
        public void sendNewBrand(string s)
        {
            string[] brands = System.IO.File.ReadAllLines(@"C:\Users\ISEN\Documents\Visual Studio 2015\Projects\AdRater\brands.txt");
            string[] addedBrand = new string[1];
            addedBrand[0] = s;
            if (!brands.Contains(s))
            {
                using (System.IO.StreamWriter file = new System.IO.StreamWriter(@"C:\Users\ISEN\Documents\Visual Studio 2015\Projects\AdRater\brands.txt", true))
                {
                    file.WriteLine(s);
                }
            }
        }

        [StateObject]
        public class Grade
        {
            public int upvotes { get; set; }
            public int downvotes { get; set; }
            public string comment { get; set; }
            public string brand { get; set; }
            public string date { get; set; }
        }

        [StateObject]
        public class BrandsList
        {
            public List<string> brands { get; set; }
        }


        public override void OnStart()
        {
            PackageHost.LastStateObjectsReceived += (s, e) =>
            {
                foreach (StateObject so in e.StateObjects)
                {
                    PackageHost.PushStateObject(so.Name, so.DynamicValue, so.Type, so.Metadatas, so.Lifetime);
                }
            };

            PackageHost.WriteInfo("package AdRater starting - IsRunning: {0} - IsConnected: {1}", PackageHost.IsRunning, PackageHost.IsConnected);

            PackageHost.StateObjectUpdated += (s, e) =>
            {
                /*string brand = e.StateObject.DynamicValue.brand;
                using (System.IO.StreamWriter file = new System.IO.StreamWriter(@"C:\Users\ISEN\Documents\Visual Studio 2015\Projects\AdRater\grades.txt", true))
                {
                    var SO = e.StateObject.DynamicValue;
                    file.WriteLine(SO.brand + "|" + SO.mark + "|" + SO.comment);
                }*/

            };
            PackageHost.RequestStateObjects(package: "AdRaterPackage");
            PackageHost.SubscribeStateObjects(package: "AdRaterPackage");
        }

        public override void OnPreShutdown()
        {
            base.OnPreShutdown();
        }

        public override void OnShutdown()
        {
            base.OnShutdown();
        }
    }
}
